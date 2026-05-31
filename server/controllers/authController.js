import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, registerNumber, password } = req.body;

  try {
    const query = {};
    if (email) {
      query.email = email;
    } else if (registerNumber) {
      query.registerNumber = registerNumber;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or register number',
        errors: []
      });
    }

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account disabled. Contact administrator.',
          errors: []
        });
      }

      user.lastLogin = Date.now();
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: generateToken(user._id),
          mustChangePassword: user.mustChangePassword,
          user: {
            id: user._id,
            name: user.name,
            role: user.role,
            department: user.department,
          },
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: []
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

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', errors: [error.message] });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.phone = req.body.phone || user.phone;
    user.bio = req.body.bio || user.bio;
    if (req.body.dateOfBirth) user.dateOfBirth = req.body.dateOfBirth;

    const updatedUser = await user.save();
    
    // Create a safe payload without password
    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    res.json({ success: true, message: 'Profile updated successfully', data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', errors: [error.message] });
  }
};
