import User from '../models/User.js';
import Student from '../models/Student.js';
import ClassRoom from '../models/ClassRoom.js';
import mongoose from 'mongoose';

// @desc    Get classes assigned to incharge
// @route   GET /api/incharge/classes
// @access  Private (Class Incharge)
export const getInchargeClasses = async (req, res) => {
  try {
    const classes = await ClassRoom.find({ inchargeId: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Assigned classes retrieved successfully',
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get student roster for a class
// @route   GET /api/incharge/classes/:classId/students
// @access  Private (Class Incharge or HOD)
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify classroom exists
    const classRoom = await ClassRoom.findById(classId);
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Class Incharges can only view their assigned classes
    if (req.user.role === 'class_incharge' && classRoom.inchargeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to classroom student roster',
        errors: []
      });
    }

    const students = await Student.find({ classId })
      .sort({ registerNumber: 1 })
      .lean();

    res.json({
      success: true,
      message: 'Student roster retrieved successfully',
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Add single student to classroom
// @route   POST /api/incharge/classes/:classId/students
// @access  Private (Class Incharge)
export const addStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, email, registerNumber, department, password, year, rollNumber, batchYear } = req.body;

    const classRoom = await ClassRoom.findById(classId);
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Authorization check
    if (req.user.role === 'class_incharge' && classRoom.inchargeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the incharge of this class',
        errors: []
      });
    }

    // Check unique email and registerNumber
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        errors: []
      });
    }

    const regExists = await User.findOne({ registerNumber });
    if (regExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this register number already exists',
        errors: []
      });
    }

    // Default password to Register Number if not provided
    const userPassword = password || registerNumber;

    // Create User
    const user = await User.create({
      name,
      email,
      password: userPassword,
      role: 'student',
      department: department || classRoom.department,
      registerNumber,
      createdBy: req.user._id,
    });

    // Create Student
    const student = await Student.create({
      name,
      email,
      password: userPassword,
      department: department || classRoom.department,
      registerNumber,
      userId: user._id,
      createdBy: req.user._id,
      classId: classRoom._id,
      currentSemester: classRoom.semester,
      currentSection: classRoom.section,
      year: year || classRoom.year,
      rollNumber: rollNumber || '',
      batchYear: batchYear || classRoom.academicYear,
      academicStatus: 'Regular'
    });

    // Update studentsCount on ClassRoom
    classRoom.studentsCount = await Student.countDocuments({ classId: classRoom._id });
    await classRoom.save();

    res.status(201).json({
      success: true,
      message: 'Student onboarded successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Edit student profile
// @route   PUT /api/incharge/students/:id
// @access  Private (Class Incharge)
export const editStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, registerNumber, department, year, rollNumber, batchYear, academicStatus, currentSemester, currentSection } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: []
      });
    }

    // Verify incharge owns this student's class
    if (req.user.role === 'class_incharge') {
      const classRoom = await ClassRoom.findById(student.classId);
      if (!classRoom || classRoom.inchargeId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: This student does not belong to your assigned class',
          errors: []
        });
      }
    }

    // Email unique check
    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
          errors: []
        });
      }
    }

    // Register Number unique check
    if (registerNumber && registerNumber !== student.registerNumber) {
      const regExists = await User.findOne({ registerNumber });
      if (regExists) {
        return res.status(400).json({
          success: false,
          message: 'Register number already in use',
          errors: []
        });
      }
    }

    // Update User record
    const user = await User.findById(student.userId);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.department = department || user.department;
      user.registerNumber = registerNumber || user.registerNumber;
      await user.save();
    }

    // Update Student record
    student.name = name || student.name;
    student.email = email || student.email;
    student.registerNumber = registerNumber || student.registerNumber;
    student.department = department || student.department;
    student.year = year !== undefined ? year : student.year;
    student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
    student.batchYear = batchYear || student.batchYear;
    student.academicStatus = academicStatus || student.academicStatus;
    student.currentSemester = currentSemester !== undefined ? currentSemester : student.currentSemester;
    student.currentSection = currentSection || student.currentSection;

    await student.save();

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Delete student profile
// @route   DELETE /api/incharge/students/:id
// @access  Private (Class Incharge)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: []
      });
    }

    // Verify incharge owns this student's class
    if (req.user.role === 'class_incharge') {
      const classRoom = await ClassRoom.findById(student.classId);
      if (!classRoom || classRoom.inchargeId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: This student does not belong to your assigned class',
          errors: []
        });
      }
    }

    const previousClassId = student.classId;

    // Delete User and Student documents
    if (student.userId) {
      await User.deleteOne({ _id: student.userId });
    }
    await Student.deleteOne({ _id: student._id });

    // Decrement class count
    if (previousClassId) {
      const classRoom = await ClassRoom.findById(previousClassId);
      if (classRoom) {
        classRoom.studentsCount = await Student.countDocuments({ classId: previousClassId });
        await classRoom.save();
      }
    }

    res.json({
      success: true,
      message: 'Student removed successfully',
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

// @desc    Bulk CSV Import students
// @route   POST /api/incharge/classes/:classId/import
// @access  Private (Class Incharge)
export const importCSV = async (req, res) => {
  try {
    const { classId } = req.params;
    const { csvText } = req.body;

    if (!csvText) {
      return res.status(400).json({
        success: false,
        message: 'CSV raw string is required',
        errors: []
      });
    }

    const classRoom = await ClassRoom.findById(classId);
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Verify class incharge
    if (req.user.role === 'class_incharge' && classRoom.inchargeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the incharge of this class',
        errors: []
      });
    }

    // Resilient, package-free array splitting CSV parser
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'CSV is empty or missing headers',
        errors: []
      });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    
    // Validate headers
    const requiredHeaders = ['name', 'email', 'registernumber'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required CSV headers: ${missingHeaders.join(', ')}`,
        errors: []
      });
    }

    let successCount = 0;
    const failedRows = [];

    // Parse other optional fields index
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const regIdx = headers.indexOf('registernumber');
    const rollIdx = headers.indexOf('rollnumber');
    const passwordIdx = headers.indexOf('password');
    const batchIdx = headers.indexOf('batchyear');

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Handlers for commas within quoted columns
      const cols = [];
      let currentVal = '';
      let insideQuote = false;

      for (let charIdx = 0; charIdx < row.length; charIdx++) {
        const char = row[charIdx];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cols.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim());

      const name = cols[nameIdx];
      const email = cols[emailIdx];
      const registerNumber = cols[regIdx];
      const rollNumber = rollIdx !== -1 ? cols[rollIdx] : '';
      const password = passwordIdx !== -1 && cols[passwordIdx] ? cols[passwordIdx] : registerNumber;
      const batchYear = batchIdx !== -1 && cols[batchIdx] ? cols[batchIdx] : classRoom.academicYear;

      if (!name || !email || !registerNumber) {
        failedRows.push({
          row: i + 1,
          data: row,
          reason: 'Missing name, email, or register number'
        });
        continue;
      }

      try {
        // Uniqueness check
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          failedRows.push({
            row: i + 1,
            data: row,
            reason: `Email ${email} already exists`
          });
          continue;
        }

        const regExists = await User.findOne({ registerNumber });
        if (regExists) {
          failedRows.push({
            row: i + 1,
            data: row,
            reason: `Register number ${registerNumber} already exists`
          });
          continue;
        }

        // Create User
        const user = await User.create({
          name,
          email,
          password,
          role: 'student',
          department: classRoom.department,
          registerNumber,
          createdBy: req.user._id,
        });

        // Create Student
        await Student.create({
          name,
          email,
          password,
          department: classRoom.department,
          registerNumber,
          userId: user._id,
          createdBy: req.user._id,
          classId: classRoom._id,
          currentSemester: classRoom.semester,
          currentSection: classRoom.section,
          year: classRoom.year,
          rollNumber,
          batchYear,
          academicStatus: 'Regular'
        });

        successCount++;
      } catch (err) {
        failedRows.push({
          row: i + 1,
          data: row,
          reason: err.message
        });
      }
    }

    // Update students count
    classRoom.studentsCount = await Student.countDocuments({ classId: classRoom._id });
    await classRoom.save();

    res.json({
      success: true,
      message: `CSV processing complete. Successfully imported ${successCount} student(s).`,
      data: {
        successCount,
        failedCount: failedRows.length,
        failedRows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during CSV import',
      errors: [error.message]
    });
  }
};
