import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// @desc    Mark attendance (bulk update)
// @route   POST /api/attendance
// @access  Private (Faculty, Class Incharge)
export const markAttendance = async (req, res) => {
  try {
    const { subjectCode, subjectName, attendanceData } = req.body;
    // attendanceData is an array: [{ studentId, present: boolean }]
    
    if (req.user.role !== 'faculty' && req.user.role !== 'class_incharge') {
      return res.status(403).json({ message: 'Not authorized' });
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

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
      // For faculty/incharge, they might pass a studentId query param, otherwise return all
      const { studentId } = req.query;
      if (studentId) {
        records = await Attendance.find({ studentId }).populate('studentId', 'name registerNumber');
      } else {
        records = await Attendance.find({}).populate('studentId', 'name registerNumber');
      }
    }
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
