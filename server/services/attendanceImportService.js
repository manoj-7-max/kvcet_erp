import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import ClassRoom from '../models/ClassRoom.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Parse a CSV column header to a UTC Date object for the given month
// ─────────────────────────────────────────────────────────────────────────────
export const parseHeaderToDate = (header, monthStr, yearNum) => {
  // Full ISO/slash date string
  const parsed = new Date(header);
  if (!isNaN(parsed.getTime()) && (header.includes('-') || header.includes('/'))) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }

  // Numeric day column (1-31)
  const dayMatch = header.match(/^0*([1-9]|[12]\d|3[01])$/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1]);
    const monthMap = {
      january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
      may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
      sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
      dec: 11, december: 11
    };

    const cleanedMonth = monthStr.split(' ')[0].toLowerCase();
    const monthIndex = monthMap[cleanedMonth] !== undefined ? monthMap[cleanedMonth] : 2;
    return new Date(Date.UTC(yearNum, monthIndex, day));
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-CREATE STUDENT USERS FROM CSV ROWS
// Called before attendance import to ensure all students have ERP accounts.
// ─────────────────────────────────────────────────────────────────────────────
export const autoCreateStudentsFromCSV = async ({ csvText, classRoom, importedBy }) => {
  const DEFAULT_PASSWORD = 'KVCET@123';

  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { newUsersCreated: 0, existingCount: 0, credentialsList: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const regIdx  = headers.findIndex(h => h.toLowerCase() === 'regno');
  const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');

  if (regIdx === -1) throw new Error('CSV missing "RegNo" column');

  const newUsersCreated  = [];
  const existingStudents = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const regNo = cols[regIdx] || '';
    const name  = nameIdx !== -1 ? cols[nameIdx] : regNo;

    if (!regNo) continue;

    // Check if User already exists
    const existingUser = await User.findOne({ registerNumber: regNo.toUpperCase() }).lean();
    if (existingUser) {
      existingStudents.push({ registerNumber: regNo, name, status: 'existing' });
      continue;
    }

    const email    = `${regNo.toLowerCase()}@kvcetstudent.edu`;
    const rollNum  = `${classRoom.year}${classRoom.section}${String(i).padStart(3, '0')}`;

    try {
      // Hash password
      const salt     = await bcrypt.genSalt(10);
      const hashed   = await bcrypt.hash(DEFAULT_PASSWORD, salt);

      // Create User
      const user = await User.create({
        name,
        email,
        password:          hashed,
        role:              'student',
        department:        classRoom.department,
        registerNumber:    regNo.toUpperCase(),
        isActive:          true,
        mustChangePassword: true,
        createdBy:         importedBy,
      });

      // Create Student
      await Student.create({
        name,
        email,
        password:        hashed,
        department:      classRoom.department,
        registerNumber:  regNo.toUpperCase(),
        userId:          user._id,
        createdBy:       importedBy,
        classId:         classRoom._id,
        currentSemester: classRoom.semester,
        currentSection:  classRoom.section,
        year:            classRoom.year,
        rollNumber:      rollNum,
        batchYear:       classRoom.academicYear,
        academicStatus:  'Regular',
        isActive:        true,
      });

      newUsersCreated.push({
        registerNumber: regNo.toUpperCase(),
        name,
        email,
        defaultPassword: DEFAULT_PASSWORD,
        status: 'created',
      });
    } catch (err) {
      // Email conflict or duplicate key — treat as already existing
      if (err.code === 11000) {
        existingStudents.push({ registerNumber: regNo, name, status: 'existing' });
      } else {
        console.error(`  Failed to create user for ${regNo}: ${err.message}`);
      }
    }
  }

  // Update class student count
  const count = await Student.countDocuments({ classId: classRoom._id });
  await ClassRoom.findByIdAndUpdate(classRoom._id, { studentsCount: count });

  return {
    newUsersCreated: newUsersCreated.length,
    existingCount:   existingStudents.length,
    credentialsList: newUsersCreated,   // only newly created rows
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT ATTENDANCE FROM CSV
// Reads 1/0 daily columns and bulk-upserts Attendance records.
// ─────────────────────────────────────────────────────────────────────────────
export const importAttendanceCSV = async ({ csvText, classId, importedBy, month, year }) => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error('CSV is empty or missing header records');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
  const regIdx  = headers.findIndex(
    h => h.toLowerCase() === 'regno' || h.toLowerCase() === 'registernumber' || h.toLowerCase() === 'register number'
  );

  if (regIdx === -1) throw new Error('CSV is missing student Register Number column (RegNo / registerNumber)');

  const yearNum  = parseInt(year) || 2026;
  const monthStr = month || 'March 2026';

  // Extract date column indices
  const dateColumns = [];
  headers.forEach((h, index) => {
    if (index === nameIdx || index === regIdx) return;
    const dateObj = parseHeaderToDate(h, monthStr, yearNum);
    if (dateObj) dateColumns.push({ index, date: dateObj });
  });

  if (dateColumns.length === 0) throw new Error('CSV does not contain any valid attendance date or day columns');

  // Pre-fetch students in this class
  const studentsList = await Student.find({ classId }).lean();
  const studentMap   = new Map(studentsList.map(s => [s.registerNumber.toUpperCase(), s]));

  const bulkOps     = [];
  let importedCount = 0;
  let skippedCount  = 0;
  const failedRows  = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];

    // Resilient quoted-comma parser
    const cols = [];
    let currentVal = '', insideQuote = false;
    for (let charIdx = 0; charIdx < row.length; charIdx++) {
      const char = row[charIdx];
      if (char === '"' || char === "'") { insideQuote = !insideQuote; }
      else if (char === ',' && !insideQuote) { cols.push(currentVal.trim().replace(/^["']|["']$/g, '')); currentVal = ''; }
      else { currentVal += char; }
    }
    cols.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const registerNumber = cols[regIdx];
    const studentName    = nameIdx !== -1 ? cols[nameIdx] : 'Unknown';

    if (!registerNumber) {
      failedRows.push({ row: i + 1, studentName, reason: 'Register number is empty' });
      continue;
    }

    const studentProfile = studentMap.get(registerNumber.toUpperCase());
    if (!studentProfile) {
      failedRows.push({ row: i + 1, studentName, registerNumber, reason: `Student ${registerNumber} not enrolled in this class` });
      continue;
    }

    const studentUserId = studentProfile.userId || studentProfile._id;

    dateColumns.forEach(({ index, date }) => {
      const cellVal = cols[index];
      if (cellVal === undefined || cellVal === '') return; // skip weekends/holidays

      let finalStatus = 'Absent';
      const cleanVal  = cellVal.trim().toUpperCase();
      if      (cleanVal === '1' || cleanVal === 'P' || cleanVal === 'PRESENT') finalStatus = 'Present';
      else if (cleanVal === '0' || cleanVal === 'A' || cleanVal === 'ABSENT')  finalStatus = 'Absent';
      else if (cleanVal === 'OD')                                               finalStatus = 'OD';
      else if (cleanVal === 'L' || cleanVal === 'LEAVE')                        finalStatus = 'Leave';

      bulkOps.push({
        updateOne: {
          filter: { studentId: studentUserId, attendanceDate: date },
          update: {
            $set: {
              studentId:      studentUserId,
              registerNumber: studentProfile.registerNumber,
              classId,
              attendanceDate: date,
              status:         finalStatus,
              importedBy,
              month:          monthStr,
              year:           yearNum,
            },
          },
          upsert: true,
        },
      });
      importedCount++;
    });
  }

  if (bulkOps.length > 0) {
    const result = await Attendance.bulkWrite(bulkOps, { ordered: false });
    skippedCount = result.matchedCount || 0;
  }

  return { success: true, importedCount, skippedCount, failedRows };
};
