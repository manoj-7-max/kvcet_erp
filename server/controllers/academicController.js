import AcademicRecord from '../models/AcademicRecord.js';
import InternalMark from '../models/InternalMark.js';
import DailyTest from '../models/DailyTest.js';

// ---- Academic Records ---- //

// @desc    Add academic record
// @route   POST /api/academic/records
export const addAcademicRecord = async (req, res) => {
  try {
    const record = await AcademicRecord.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get academic records
// @route   GET /api/academic/records
export const getAcademicRecords = async (req, res) => {
  try {
    let records;
    if (req.user.role === 'student') {
      records = await AcademicRecord.find({ studentId: req.user._id });
    } else {
      records = await AcademicRecord.find({}).populate('studentId', 'name registerNumber');
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---- Internal Marks ---- //

// @desc    Add internal marks (bulk)
// @route   POST /api/academic/internal-marks
export const addInternalMarks = async (req, res) => {
  try {
    const { subjectCode, assessmentType, maximumMarks, marksData } = req.body;
    
    const bulkOps = marksData.map((data) => ({
      updateOne: {
        filter: { studentId: data.studentId, subjectCode, assessmentType },
        update: {
          $set: { 
            studentId: data.studentId, 
            subjectCode, 
            assessmentType, 
            maximumMarks,
            marksScored: data.marksScored,
            facultyId: req.user._id
          }
        },
        upsert: true
      }
    }));

    await InternalMark.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Internal marks saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get internal marks
// @route   GET /api/academic/internal-marks
export const getInternalMarks = async (req, res) => {
  try {
    let marks;
    if (req.user.role === 'student') {
      marks = await InternalMark.find({ studentId: req.user._id });
    } else {
      marks = await InternalMark.find({}).populate('studentId', 'name registerNumber');
    }
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---- Daily Tests ---- //

// @desc    Add/Update daily test marks (bulk)
// @route   POST /api/academic/daily-tests
export const addDailyTests = async (req, res) => {
  try {
    const { subjectCode, deadline, dateConducted, testData } = req.body;
    
    const bulkOps = testData.map((data) => ({
      updateOne: {
        filter: { studentId: data.studentId, subjectCode, dateConducted },
        update: {
          $set: { 
            studentId: data.studentId, 
            subjectCode, 
            facultyName: req.user.name,
            partA: data.partA,
            partB: data.partB,
            deadline,
            dateConducted
          }
        },
        upsert: true
      }
    }));

    await DailyTest.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Daily test marks saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get daily tests
// @route   GET /api/academic/daily-tests
export const getDailyTests = async (req, res) => {
  try {
    let tests;
    if (req.user.role === 'student') {
      tests = await DailyTest.find({ studentId: req.user._id });
    } else {
      tests = await DailyTest.find({}).populate('studentId', 'name registerNumber');
    }
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
