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
    // Find by email OR registerNumber
    const query = {};
    if (email) {
      query.email = email;
    } else if (registerNumber) {
      query.registerNumber = registerNumber;
    } else {
      return res.status(400).json({ message: 'Please provide email or register number' });
    }

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account disabled. Contact administrator.' });
      }

      // Update lastLogin
      user.lastLogin = Date.now();
      await user.save();

      res.json({
        token: generateToken(user._id),
        mustChangePassword: user.mustChangePassword,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
