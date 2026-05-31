/**
 * cleanAndReimport.js
 *
 * Reads the REAL March 2026 attendance CSV:
 *   CLASS_LOG_CSE_2025-26-MARCH_2026 - CSE_2_A.csv
 *
 * CSV Structure (real format):
 *   Line 8  = date row  : col 4..34 = "01-03-26","02-03-26",...,"31-03-26"
 *   Line 9  = header row: Sn, RegNo, Name, [dept], SUN, MON, TUE...
 *   Line 10+ = student rows (valid if col[1] is a 12-digit register number)
 *   Cols 35+ = Total, %, Day, Date, DAY_EVENT_RECORD (skip these)
 *
 * STEP 1: Delete all old seeded CS2026XXX + 421224104XXX student docs
 * STEP 2: Auto-create User + Student accounts for all 58 real students
 *         Email   : <regno.toLowerCase()>@kvcetstudent.edu
 *         Password: KVCET@123  (bcrypt hashed, mustChangePassword=true)
 * STEP 3: Import attendance (1=Present, 0=Absent, blank=weekend/holiday)
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Student from './models/Student.js';
import ClassRoom from './models/ClassRoom.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const CSV_PATH   = path.join(__dirname, 'uploads', 'CLASS_LOG_CSE_2025-26-MARCH_2026 - CSE_2_A.csv');
const CLASS_NAME = 'II CSE A';
const DEFAULT_PW = 'KVCET@123';

// ── Parse "DD-MM-YY" or "DD-MM-26" → UTC Date ───────────────────────────────
const parseDate = (str) => {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split('-');
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  const year = parseInt(yy) < 100 ? 2000 + parseInt(yy) : parseInt(yy);
  const d = new Date(Date.UTC(year, parseInt(mm) - 1, parseInt(dd)));
  return isNaN(d.getTime()) ? null : d;
};

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await connectDB();

    // ── Find classroom ────────────────────────────────────────────────────
    let classRoom = await ClassRoom.findOne({ className: CLASS_NAME });
    if (!classRoom) {
      const incharge = await User.findOne({ role: 'class_incharge' }).lean();
      classRoom = await ClassRoom.create({
        className: CLASS_NAME, department: 'CSE', year: 2, section: 'A',
        semester: 3, academicYear: '2025-2026', studentsCount: 0,
        isActive: true, inchargeId: incharge?._id
      });
      console.log(`✅  Auto-created classroom: ${CLASS_NAME}`);
    }
    console.log(`🏫 Classroom: ${classRoom.className}  (Sem ${classRoom.semester})\n`);

    // ── Find incharge ─────────────────────────────────────────────────────
    const inchargeUser = await User.findOne({ role: 'class_incharge' }).lean();
    if (!inchargeUser) { console.error('❌  No class_incharge found.'); process.exit(1); }
    console.log(`👤 Importer: ${inchargeUser.name}\n`);

    // ── STEP 1: Wipe old students from this class ─────────────────────────
    console.log('🗑️  STEP 1 — Removing old student accounts linked to this class...');
    const oldStudents = await Student.find({ classId: classRoom._id }).lean();
    const oldUserIds  = oldStudents.map(s => s.userId).filter(Boolean);
    const oldRegNos   = oldStudents.map(s => s.registerNumber);

    const attDel = await Attendance.deleteMany({
      $or: [{ studentId: { $in: oldUserIds } }, { registerNumber: { $in: oldRegNos } }]
    });
    const usrDel = await User.deleteMany({ _id: { $in: oldUserIds } });
    const stuDel = await Student.deleteMany({ classId: classRoom._id });

    await ClassRoom.findByIdAndUpdate(classRoom._id, { studentsCount: 0 });
    console.log(`   Deleted: ${stuDel.deletedCount} students, ${usrDel.deletedCount} users, ${attDel.deletedCount} attendance records\n`);

    // ── STEP 2: Parse CSV ────────────────────────────────────────────────
    if (!fs.existsSync(CSV_PATH)) { console.error(`❌  CSV not found: ${CSV_PATH}`); process.exit(1); }
    const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines   = csvText.split(/\r?\n/);

    // Line 8 (0-indexed) = date row, cols 4..34
    const dateLine  = lines[8].split(',');
    // Line 9 = column headers
    const headerLine = lines[9].split(',');

    // Map column index → UTC Date (only cols where date string exists in line 8)
    const dateColumns = [];
    dateLine.forEach((cell, idx) => {
      const d = parseDate(cell);
      if (d) dateColumns.push({ index: idx, date: d });
    });
    console.log(`📅 Detected ${dateColumns.length} date columns from CSV`);

    // Student rows = lines 10+ where col[1] is a 12-digit number
    const studentRows = lines.slice(10).filter(l => {
      const cols = l.split(',');
      return cols[1] && cols[1].trim().match(/^\d{10,15}$/);
    });
    console.log(`👥 ${studentRows.length} student rows found in CSV\n`);

    // ── STEP 3: Create User + Student for each row ───────────────────────
    console.log('👤 STEP 2 — Creating student ERP accounts...');
    // NOTE: Do NOT manually hash the password here.
    // The User model has a pre('save') hook that hashes it automatically.
    // Pre-hashing would cause double-hashing and make login always fail.

    const credentialsList = [];
    const studentMap = new Map(); // regNo → { userId, studentDoc }

    for (let i = 0; i < studentRows.length; i++) {
      const cols   = studentRows[i].split(',');
      const regNo  = cols[1].trim().toUpperCase();
      const name   = cols[2].trim();
      const email  = `${regNo.toLowerCase()}@kvcetstudent.edu`;
      const rollNo = `CS24A${String(i + 1).padStart(2, '0')}`;

      // Check for existing user (duplicate-safe)
      const existingUser = await User.findOne({ registerNumber: regNo }).lean();
      if (existingUser) {
        const existingSt = await Student.findOne({ registerNumber: regNo }).lean();
        if (existingSt) studentMap.set(regNo, { userId: existingUser._id, studentId: existingSt._id });
        continue;
      }

      try {
        const user = await User.create({
          name, email,
          password:          DEFAULT_PW,   // plain text — model pre-save hook will hash it once
          role:              'student',
          department:        'CSE',
          registerNumber:    regNo,
          isActive:          true,
          mustChangePassword: true,
          createdBy:         inchargeUser._id,
        });

        const student = await Student.create({
          name, email,
          password:        DEFAULT_PW,   // plain text for Student record reference
          department:      'CSE',
          registerNumber:  regNo,
          userId:          user._id,
          createdBy:       inchargeUser._id,
          classId:         classRoom._id,
          currentSemester: 3,
          currentSection:  'A',
          year:            2,
          rollNumber:      rollNo,
          batchYear:       '2025-2026',
          academicStatus:  'Regular',
          isActive:        true,
        });

        studentMap.set(regNo, { userId: user._id, studentId: student._id });
        credentialsList.push({ regNo, name, email, password: DEFAULT_PW });
      } catch (err) {
        console.error(`  ⚠️  Skipped ${regNo} (${name}): ${err.message}`);
      }
    }

    // Update class count
    const count = await Student.countDocuments({ classId: classRoom._id });
    await ClassRoom.findByIdAndUpdate(classRoom._id, { studentsCount: count });
    console.log(`   ✅ ${credentialsList.length} new accounts created\n`);

    // Print credentials table
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('  STUDENT CREDENTIALS (share with students for first login)');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('  RegNo          | Name                       | Email                                  | Password');
    console.log('───────────────────────────────────────────────────────────────────────────────');
    credentialsList.forEach(c => {
      const reg  = c.regNo.padEnd(14);
      const name = c.name.padEnd(26);
      const em   = c.email.padEnd(39);
      console.log(`  ${reg} | ${name} | ${em} | ${c.password}`);
    });
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    // ── STEP 4: Re-fetch student map from DB (fresh) ─────────────────────
    const allStudents = await Student.find({ classId: classRoom._id }).lean();
    const dbStudentMap = new Map(allStudents.map(s => [s.registerNumber.toUpperCase(), s]));

    // ── STEP 5: Import attendance records ────────────────────────────────
    console.log('📅 STEP 3 — Importing attendance records from CSV...');
    const bulkOps    = [];
    let   imported   = 0;
    let   skipped    = 0;

    for (const rowLine of studentRows) {
      const cols  = rowLine.split(',');
      const regNo = cols[1].trim().toUpperCase();
      const st    = dbStudentMap.get(regNo);
      if (!st) { skipped++; continue; }

      const studentRef = st.userId || st._id;

      for (const { index, date } of dateColumns) {
        const cell = (cols[index] || '').trim();
        // Blank = weekend/holiday = skip
        if (cell === '') continue;

        let status = 'Absent';
        if (cell === '1' || cell.toUpperCase() === 'P') status = 'Present';
        else if (cell === '0' || cell.toUpperCase() === 'A') status = 'Absent';
        else if (cell.toUpperCase() === 'OD') status = 'OD';
        else if (cell.toUpperCase() === 'L') status = 'Leave';
        else continue; // skip non-attendance cells (like Total, %)

        bulkOps.push({
          updateOne: {
            filter: { studentId: studentRef, attendanceDate: date },
            update: {
              $set: {
                studentId:      studentRef,
                registerNumber: st.registerNumber,
                classId:        classRoom._id,
                attendanceDate: date,
                status,
                importedBy:     inchargeUser._id,
                month:          'March 2026',
                year:           2026,
              }
            },
            upsert: true,
          }
        });
        imported++;
      }
    }

    if (bulkOps.length > 0) {
      const result = await Attendance.bulkWrite(bulkOps, { ordered: false });
      console.log(`   ✅ bulkWrite done — Upserted: ${result.upsertedCount}, Updated: ${result.matchedCount}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('✅  CLEAN REIMPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`   Students created     : ${credentialsList.length}`);
    console.log(`   Attendance records   : ${imported}`);
    console.log(`   Skipped (not found)  : ${skipped}`);
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log('  Default login:');
    console.log('  Email    : <registerNumber.toLowerCase()>@kvcetstudent.edu');
    console.log('  Password : KVCET@123  (must change on first login)');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
};

run();
