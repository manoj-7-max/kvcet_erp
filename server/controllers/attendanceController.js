import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import ClassRoom from '../models/ClassRoom.js';
import User from '../models/User.js';
import { importAttendanceCSV, autoCreateStudentsFromCSV } from '../services/attendanceImportService.js';
import mongoose from 'mongoose';

// ==========================================
// LEGACY / SUBJECT-WISE AGGREGATE METHODS
// ==========================================

// @desc    Mark attendance (bulk update)
// @route   POST /api/attendance
// @access  Private (Faculty, Class Incharge)
export const markAttendance = async (req, res) => {
  try {
    const { subjectCode, subjectName, attendanceData } = req.body;

    if (req.user.role !== 'faculty' && req.user.role !== 'class_incharge') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendance',
        errors: []
      });
    }

    const bulkOps = attendanceData.map((data) => ({
      updateOne: {
        filter: { studentId: data.studentId, subjectCode },
        update: {
          $setOnInsert: { studentId: data.studentId, subjectCode, subjectName },
          $inc: { 
            totalClasses: 1, 
            classesAttended: data.present ? 1 : 0 
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    let records;
    if (req.user.role === 'student') {
      records = await Attendance.find({ studentId: req.user._id });
    } else {
      const { studentId } = req.query;
      if (studentId) {
        records = await Attendance.find({ studentId }).populate('studentId', 'name registerNumber');
      } else {
        records = await Attendance.find({}).populate('studentId', 'name registerNumber');
      }
    }

    res.json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// ==========================================
// NEW DAILY ATTENDANCE IMPORT & ANALYTICS
// ==========================================

// @desc    Import daily attendance records via CSV (with auto-create student users)
// @route   POST /api/attendance/class/:classId/import-attendance
// @access  Private (Class Incharge)
export const importAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { month, year } = req.body;
    const io = req.app.get('io');

    let csvText = req.body.csvText;
    if (req.file) {
      csvText = req.file.buffer.toString('utf-8');
    }

    if (!csvText) {
      return res.status(400).json({
        success: false,
        message: 'CSV raw file upload or csvText body string is required',
        errors: []
      });
    }

    // Verify classroom
    const classRoom = await ClassRoom.findById(classId).lean();
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Auth check — incharge can only import for their own class
    if (
      req.user.role === 'class_incharge' &&
      classRoom.inchargeId &&
      classRoom.inchargeId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the assigned Class Incharge of this classroom',
        errors: []
      });
    }

    // ── STEP 1: Auto-create student ERP accounts from CSV rows ──────────────
    const userCreationResult = await autoCreateStudentsFromCSV({
      csvText,
      classRoom,
      importedBy: req.user._id,
    });

    // ── STEP 2: Import attendance records ────────────────────────────────────
    const attendanceReport = await importAttendanceCSV({
      csvText,
      classId,
      importedBy: req.user._id,
      month:  month  || 'March 2026',
      year:   parseInt(year) || 2026,
    });

    // ── STEP 3: Emit socket events ───────────────────────────────────────────
    if (io) {
      // Notify HOD role room
      io.to('hod').emit('notification:new', {
        title:   'Attendance Import Complete',
        message: `${classRoom.className}: ${attendanceReport.importedCount} records imported, ${userCreationResult.newUsersCreated} new student accounts created.`,
        role:    'hod',
        type:    'info',
      });

      // Notify the class incharge who triggered the import
      io.to(req.user._id.toString()).emit('notification:new', {
        title:   'Import Successful',
        message: `Attendance imported for ${classRoom.className}. ${userCreationResult.newUsersCreated} new student accounts auto-created.`,
        type:    'success',
      });

      // Broadcast user:created and attendance:imported events
      if (userCreationResult.newUsersCreated > 0) {
        io.to('hod').emit('user:created', {
          className:   classRoom.className,
          newUsers:    userCreationResult.newUsersCreated,
          importedBy:  req.user.name || req.user.email,
        });
      }

      io.to('hod').emit('attendance:imported', {
        classId:      classRoom._id,
        className:    classRoom.className,
        importedCount: attendanceReport.importedCount,
        month:        month || 'March 2026',
      });
    }

    res.json({
      success: true,
      message: `Import complete. ${userCreationResult.newUsersCreated} new student accounts created, ${attendanceReport.importedCount} attendance records processed.`,
      data: {
        // Student creation summary
        totalStudents:    userCreationResult.newUsersCreated + userCreationResult.existingCount,
        newUsersCreated:  userCreationResult.newUsersCreated,
        existingStudents: userCreationResult.existingCount,
        credentialsList:  userCreationResult.credentialsList,
        // Attendance summary
        attendanceInserted: attendanceReport.importedCount,
        skippedDuplicates:  attendanceReport.skippedCount,
        failedRows:         attendanceReport.failedRows,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during attendance import',
      errors: [error.message]
    });
  }
};

// @desc    Get detailed attendance analytics for class
// @route   GET /api/attendance/class/:classId/analytics
// @access  Private (Class Incharge, HOD)
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify classroom
    const classRoom = await ClassRoom.findById(classId).populate('inchargeId', 'name email').lean();
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Fetch all logs and students
    const logs = await Attendance.find({ classId, attendanceDate: { $ne: null } }).lean();
    const students = await Student.find({ classId }).lean();

    // Map logs by student user ID
    const studentLogsMap = {};
    logs.forEach(log => {
      const sId = log.studentId.toString();
      if (!studentLogsMap[sId]) {
        studentLogsMap[sId] = [];
      }
      studentLogsMap[sId].push(log);
    });

    // Compile individual students percentages
    const studentAnalytics = students.map(st => {
      const studentUserId = st.userId ? st.userId.toString() : st._id.toString();
      const stLogs = studentLogsMap[studentUserId] || [];
      
      const totalDays = stLogs.length;
      const presentDays = stLogs.filter(l => l.status === 'Present' || l.status === 'OD').length;
      const percentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(2)) : 0;
      
      return {
        studentId: studentUserId,
        name: st.name,
        registerNumber: st.registerNumber,
        rollNumber: st.rollNumber || '—',
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        percentage,
        status: percentage < 75 ? 'Shortage' : 'Normal'
      };
    });

    // Sort by register number
    studentAnalytics.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber));

    // Calculate class percentage
    const activeStudentPercentages = studentAnalytics.filter(s => s.totalDays > 0);
    const classAttendancePercentage = activeStudentPercentages.length > 0
      ? parseFloat((activeStudentPercentages.reduce((acc, s) => acc + s.percentage, 0) / activeStudentPercentages.length).toFixed(2))
      : 0;

    // Compile shortage list
    const shortageList = studentAnalytics.filter(s => s.percentage < 75 && s.totalDays > 0);

    // Compile daily logs
    const dailyMap = {};
    logs.forEach(log => {
      const dateStr = log.attendanceDate.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, present: 0, absent: 0, total: 0 };
      }
      if (log.status === 'Present' || log.status === 'OD') {
        dailyMap[dateStr].present++;
      } else {
        dailyMap[dateStr].absent++;
      }
      dailyMap[dateStr].total++;
    });

    const dailyReport = Object.values(dailyMap);
    dailyReport.sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      message: 'Attendance analytics calculated successfully',
      data: {
        classRoom,
        classAttendancePercentage,
        studentAttendancePercentages: studentAnalytics,
        dailyReport,
        shortageList
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during analytics calculation',
      errors: [error.message]
    });
  }
};

// @desc    Get HOD departmental attendance summary comparative indices
// @route   GET /api/attendance/hod/analytics
// @access  Private (HOD)
export const getHODAttendanceAnalytics = async (req, res) => {
  try {
    const classes = await ClassRoom.find({ isActive: true }).lean();
    
    const classWiseComparison = [];
    const shortageStudents = [];
    let departmentTotalPercentageSum = 0;
    let classesWithAttendanceCount = 0;
    const allStudentPercentages = [];

    for (const c of classes) {
      const students = await Student.find({ classId: c._id }).lean();
      const logs = await Attendance.find({ classId: c._id, attendanceDate: { $ne: null } }).lean();

      // Map logs
      const studentLogsMap = {};
      logs.forEach(log => {
        const sId = log.studentId.toString();
        if (!studentLogsMap[sId]) studentLogsMap[sId] = [];
        studentLogsMap[sId].push(log);
      });

      let classPresentSum = 0;
      let studentsInClassCount = 0;

      students.forEach(st => {
        const studentUserId = st.userId ? st.userId.toString() : st._id.toString();
        const stLogs = studentLogsMap[studentUserId] || [];
        if (stLogs.length > 0) {
          const totalDays = stLogs.length;
          const presentDays = stLogs.filter(l => l.status === 'Present' || l.status === 'OD').length;
          const percentage = parseFloat(((presentDays / totalDays) * 100).toFixed(2));
          
          const record = {
            name: st.name,
            registerNumber: st.registerNumber,
            className: c.className,
            percentage,
            totalDays
          };

          allStudentPercentages.push(record);
          
          if (percentage < 75) {
            shortageStudents.push(record);
          }

          classPresentSum += percentage;
          studentsInClassCount++;
        }
      });

      const classAvg = studentsInClassCount > 0 ? parseFloat((classPresentSum / studentsInClassCount).toFixed(2)) : 0;
      classWiseComparison.push({
        classId: c._id,
        className: c.className,
        studentsCount: c.studentsCount || students.length,
        averagePercentage: classAvg
      });

      if (studentsInClassCount > 0) {
        departmentTotalPercentageSum += classAvg;
        classesWithAttendanceCount++;
      }
    }

    const departmentAttendancePercentage = classesWithAttendanceCount > 0
      ? parseFloat((departmentTotalPercentageSum / classesWithAttendanceCount).toFixed(2))
      : 0;

    // Topper lists (Top 5 highest attendance in department)
    allStudentPercentages.sort((a, b) => b.percentage - a.percentage || b.totalDays - a.totalDays);
    const topperAttendance = allStudentPercentages.slice(0, 5);

    res.json({
      success: true,
      message: 'HOD Departmental attendance analytics compiled',
      data: {
        departmentAttendancePercentage,
        classWiseComparison,
        topperAttendance,
        shortageStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error compiling department analytics',
      errors: [error.message]
    });
  }
};
