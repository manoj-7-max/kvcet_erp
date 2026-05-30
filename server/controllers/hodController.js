import User from '../models/User.js';
import Student from '../models/Student.js';
import bcrypt from 'bcryptjs';

// @desc    Get all users
// @route   GET /api/hod/users
// @access  Private/HOD
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new user
// @route   POST /api/hod/users
// @access  Private/HOD
export const createUser = async (req, res) => {
  const { name, email, password, role, department, employeeId, registerNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (registerNumber) {
      const regExists = await User.findOne({ registerNumber });
      if (regExists) {
        return res.status(400).json({ message: 'User with this register number already exists' });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      employeeId,
      registerNumber,
      createdBy: req.user._id,
    });

    if (role === 'student' && registerNumber) {
      await Student.create({
        name,
        email,
        password, // The student model pre-save will hash this too, or we can just save hashed
        department,
        registerNumber,
        userId: user._id,
        createdBy: req.user._id,
      });
    }

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/hod/users/:id
// @access  Private/HOD
export const updateUser = async (req, res) => {
  const { name, email, role, department, employeeId, registerNumber } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Check email uniqueness if changing email
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: 'Email already in use' });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.department = department || user.department;
      user.employeeId = employeeId !== undefined ? employeeId : user.employeeId;
      user.registerNumber = registerNumber !== undefined ? registerNumber : user.registerNumber;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/hod/users/:id/password
// @access  Private/HOD
export const resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.password = newPassword;
      user.mustChangePassword = true;
      await user.save();

      // If student, update their student document password too
      if (user.role === 'student' && user.registerNumber) {
        const student = await Student.findOne({ registerNumber: user.registerNumber });
        if (student) {
          student.password = newPassword;
          await student.save();
        }
      }

      res.json({ message: 'Password reset successful' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user status (isActive)
// @route   PUT /api/hod/users/:id/status
// @access  Private/HOD
export const updateUserStatus = async (req, res) => {
  const { isActive } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (req.user._id.toString() === user._id.toString()) {
        return res.status(400).json({ message: 'Cannot deactivate yourself' });
      }

      user.isActive = isActive;
      await user.save();

      res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/hod/users/:id
// @access  Private/HOD
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    // Prevent deleting last HOD
    if (user.role === 'hod') {
      const hodCount = await User.countDocuments({ role: 'hod' });
      if (hodCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only HOD' });
      }
    }

    // Delete associated student document if it's a student
    if (user.role === 'student' && user.registerNumber) {
      await Student.deleteOne({ registerNumber: user.registerNumber });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
