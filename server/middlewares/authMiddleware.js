import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: 'Account disabled. Contact administrator.' });
    }

    // Find the student if it's a student role
    if (req.user.role === 'student' && req.user.registerNumber) {
      req.student = await Student.findOne({ registerNumber: req.user.registerNumber }).select('-password');
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const hodOnly = (req, res, next) => {
  if (req.user && req.user.role === 'hod') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as HOD' });
  }
};

export const facultyOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'class_incharge')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as Faculty' });
  }
};
