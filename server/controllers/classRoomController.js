import ClassRoom from '../models/ClassRoom.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';

// @desc    Get all classes
// @route   GET /api/hod/classes
// @access  Private (HOD)
export const getClasses = async (req, res) => {
  try {
    const classes = await ClassRoom.find({})
      .populate('inchargeId', 'name role email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Classes retrieved successfully',
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

// @desc    Create a new class
// @route   POST /api/hod/classes
// @access  Private (HOD)
export const createClass = async (req, res) => {
  try {
    const { className, department, year, section, academicYear, semester } = req.body;

    const exists = await ClassRoom.findOne({ className });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A class with this name already exists',
        errors: []
      });
    }

    const newClass = await ClassRoom.create({
      className,
      department,
      year,
      section,
      academicYear,
      semester,
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: newClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Update a class
// @route   PUT /api/hod/classes/:id
// @access  Private (HOD)
export const updateClass = async (req, res) => {
  try {
    const { className, department, year, section, academicYear, semester, isActive } = req.body;
    const classRoom = await ClassRoom.findById(req.params.id);

    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    if (className && className !== classRoom.className) {
      const exists = await ClassRoom.findOne({ className });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Class name already in use',
          errors: []
        });
      }
    }

    classRoom.className = className || classRoom.className;
    classRoom.department = department || classRoom.department;
    classRoom.year = year !== undefined ? year : classRoom.year;
    classRoom.section = section || classRoom.section;
    classRoom.academicYear = academicYear || classRoom.academicYear;
    classRoom.semester = semester !== undefined ? semester : classRoom.semester;
    classRoom.isActive = isActive !== undefined ? isActive : classRoom.isActive;

    await classRoom.save();

    res.json({
      success: true,
      message: 'Classroom updated successfully',
      data: classRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Delete a class
// @route   DELETE /api/hod/classes/:id
// @access  Private (HOD)
export const deleteClass = async (req, res) => {
  try {
    const classRoom = await ClassRoom.findById(req.params.id);

    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Remove this class from any assigned incharge users
    if (classRoom.inchargeId) {
      await User.findByIdAndUpdate(classRoom.inchargeId, {
        $pull: { assignedClasses: classRoom._id }
      });
    }

    // Remove reference from any assigned student profiles
    await Student.updateMany(
      { classId: classRoom._id },
      { $unset: { classId: "" } }
    );

    await ClassRoom.deleteOne({ _id: classRoom._id });

    res.json({
      success: true,
      message: 'Classroom deleted successfully',
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

// @desc    Assign class incharge
// @route   PUT /api/hod/classes/:id/incharge
// @access  Private (HOD)
export const assignIncharge = async (req, res) => {
  try {
    const { inchargeId } = req.body;
    const classRoom = await ClassRoom.findById(req.params.id);

    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Validate the incharge user exists and has the class_incharge role
    const incharge = await User.findById(inchargeId);
    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: 'Incharge user not found',
        errors: []
      });
    }

    if (incharge.role !== 'class_incharge') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must have the Class Incharge role',
        errors: []
      });
    }

    // If there is an existing incharge, pull this class from their profile first
    if (classRoom.inchargeId) {
      await User.findByIdAndUpdate(classRoom.inchargeId, {
        $pull: { assignedClasses: classRoom._id }
      });
    }

    // Link incharge inside ClassRoom
    classRoom.inchargeId = inchargeId;
    await classRoom.save();

    // Link classroom inside incharge's profile
    await User.findByIdAndUpdate(inchargeId, {
      $addToSet: { assignedClasses: classRoom._id }
    });

    // Notify new incharge
    await Notification.create({
      recipientId: inchargeId,
      senderId: req.user._id,
      title: 'Class Assigned',
      message: `You have been assigned as Class Incharge for ${classRoom.className}.`,
      type: 'system'
    });

    // Socket emission
    const io = req.app.get('io');
    if (io) {
      io.to(inchargeId.toString()).emit('notification:new', {
        title: 'Class Assigned',
        message: `You have been assigned as Class Incharge for ${classRoom.className}.`,
        type: 'system'
      });
      io.emit('class:assigned', classRoom);
    }

    res.json({
      success: true,
      message: 'Class Incharge assigned successfully',
      data: classRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Transfer class incharge
// @route   PUT /api/hod/classes/:id/transfer-incharge
// @access  Private (HOD)
export const transferIncharge = async (req, res) => {
  try {
    const { oldInchargeId, newInchargeId } = req.body;
    const classRoom = await ClassRoom.findById(req.params.id);

    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    // Validate new incharge
    const newIncharge = await User.findById(newInchargeId);
    if (!newIncharge || newIncharge.role !== 'class_incharge') {
      return res.status(400).json({
        success: false,
        message: 'New incharge must have Class Incharge role',
        errors: []
      });
    }

    // Remove class from old incharge
    if (oldInchargeId) {
      await User.findByIdAndUpdate(oldInchargeId, {
        $pull: { assignedClasses: classRoom._id }
      });
      
      // Notify old incharge
      await Notification.create({
        recipientId: oldInchargeId,
        senderId: req.user._id,
        title: 'Class Incharge Revoked',
        message: `Your class assignment for ${classRoom.className} has been transferred.`,
        type: 'system'
      });
    }

    // Add class to new incharge
    classRoom.inchargeId = newInchargeId;
    await classRoom.save();

    await User.findByIdAndUpdate(newInchargeId, {
      $addToSet: { assignedClasses: classRoom._id }
    });

    // Notify new incharge
    await Notification.create({
      recipientId: newInchargeId,
      senderId: req.user._id,
      title: 'Class Incharge Transferred',
      message: `You are now the Class Incharge for ${classRoom.className}.`,
      type: 'system'
    });

    // Sockets emission
    const io = req.app.get('io');
    if (io) {
      if (oldInchargeId) {
        io.to(oldInchargeId.toString()).emit('notification:new', {
          title: 'Class Incharge Revoked',
          message: `Your class assignment for ${classRoom.className} has been transferred.`,
          type: 'system'
        });
      }
      io.to(newInchargeId.toString()).emit('notification:new', {
        title: 'Class Incharge Transferred',
        message: `You are now the Class Incharge for ${classRoom.className}.`,
        type: 'system'
      });
      io.emit('class:transferred', { classId: classRoom._id, oldInchargeId, newInchargeId });
    }

    res.json({
      success: true,
      message: 'Class Incharge transferred successfully',
      data: classRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Transfer student between classes
// @route   PUT /api/hod/student-transfer/:studentId
// @access  Private (HOD)
export const transferStudent = async (req, res) => {
  try {
    const { fromClassId, toClassId } = req.body;
    const { studentId } = req.params;

    // Retrieve Student Profile
    // studentId can be Student._id or userId
    const student = await Student.findOne({
      $or: [{ _id: mongoose.isValidObjectId(studentId) ? studentId : null }, { userId: mongoose.isValidObjectId(studentId) ? studentId : null }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: []
      });
    }

    const previousClassId = student.classId;

    // Verify new Class exists
    const targetClass = await ClassRoom.findById(toClassId);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: 'Target classroom not found',
        errors: []
      });
    }

    // Update Student model
    student.classId = toClassId;
    student.currentSection = targetClass.section;
    student.currentSemester = targetClass.semester;
    student.year = targetClass.year;
    await student.save();

    // Update studentsCount on old class if exists
    if (previousClassId) {
      await ClassRoom.findByIdAndUpdate(previousClassId, { $inc: { studentsCount: -1 } });
    } else if (fromClassId) {
      await ClassRoom.findByIdAndUpdate(fromClassId, { $inc: { studentsCount: -1 } });
    }

    // Update studentsCount on target class
    await ClassRoom.findByIdAndUpdate(toClassId, { $inc: { studentsCount: 1 } });

    // Notify new incharge if assigned
    if (targetClass.inchargeId) {
      await Notification.create({
        recipientId: targetClass.inchargeId,
        senderId: req.user._id,
        title: 'New Student Received',
        message: `Student ${student.name} (${student.registerNumber}) has been transferred to your class ${targetClass.className}.`,
        type: 'system'
      });
    }

    // Notify student user
    await Notification.create({
      recipientId: student.userId,
      senderId: req.user._id,
      title: 'Class Transfer Completed',
      message: `Your profile has been transferred to class ${targetClass.className}.`,
      type: 'system'
    });

    // Socket Emission
    const io = req.app.get('io');
    if (io) {
      if (targetClass.inchargeId) {
        io.to(targetClass.inchargeId.toString()).emit('notification:new', {
          title: 'New Student Received',
          message: `Student ${student.name} (${student.registerNumber}) has been transferred to your class ${targetClass.className}.`,
          type: 'system'
        });
      }
      io.to(student.userId.toString()).emit('notification:new', {
        title: 'Class Transfer Completed',
        message: `Your profile has been transferred to class ${targetClass.className}.`,
        type: 'system'
      });
      io.emit('student:transferred', { studentId: student._id, fromClassId: previousClassId, toClassId });
    }

    res.json({
      success: true,
      message: 'Student transferred successfully',
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

// @desc    Promote students semester-wise
// @route   POST /api/hod/promote-class/:classId
// @access  Private (HOD)
export const promoteClass = async (req, res) => {
  try {
    const classRoom = await ClassRoom.findById(req.params.classId);

    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found',
        errors: []
      });
    }

    const currentSem = classRoom.semester;

    if (currentSem >= 8) {
      // Final Year students promote to Completed / Graduated
      await Student.updateMany(
        { classId: classRoom._id },
        { 
          $set: { academicStatus: 'Completed' },
          $unset: { classId: "" }
        }
      );

      // Deactivate/archive the class
      classRoom.isActive = false;
      classRoom.studentsCount = 0;
      await classRoom.save();

      res.json({
        success: true,
        message: 'Class promoted successfully. Students marked as Completed (Graduated) and classroom archived.',
        data: classRoom
      });
    } else {
      // Standard Promotion
      const newSem = currentSem + 1;
      const newYear = Math.ceil(newSem / 2);

      // 1. Promote all students assigned to this class
      await Student.updateMany(
        { classId: classRoom._id },
        { 
          $set: { 
            currentSemester: newSem,
            year: newYear
          }
        }
      );

      // 2. Promote ClassRoom configuration
      classRoom.semester = newSem;
      classRoom.year = newYear;
      await classRoom.save();

      // Notify Incharge
      if (classRoom.inchargeId) {
        await Notification.create({
          recipientId: classRoom.inchargeId,
          senderId: req.user._id,
          title: 'Class Promoted',
          message: `Your class ${classRoom.className} has been promoted to Semester ${newSem} (Year ${newYear}).`,
          type: 'system'
        });
      }

      // Notify student users inside this class
      const students = await Student.find({ classId: classRoom._id });
      const bulkNotifications = students.map(st => ({
        recipientId: st.userId,
        senderId: req.user._id,
        title: 'Semester Promotion',
        message: `Congratulations! You have been promoted to Semester ${newSem} (Year ${newYear}).`,
        type: 'system'
      }));
      if (bulkNotifications.length > 0) {
        await Notification.insertMany(bulkNotifications);
      }

      // Socket broadcast
      const io = req.app.get('io');
      if (io) {
        if (classRoom.inchargeId) {
          io.to(classRoom.inchargeId.toString()).emit('notification:new', {
            title: 'Class Promoted',
            message: `Your class ${classRoom.className} has been promoted to Semester ${newSem} (Year ${newYear}).`,
            type: 'system'
          });
        }
        io.emit('class:promoted', { classId: classRoom._id, semester: newSem, year: newYear });
      }

      res.json({
        success: true,
        message: `Class promoted successfully to Semester ${newSem} (Year ${newYear})`,
        data: classRoom
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
