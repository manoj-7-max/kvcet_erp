import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Student.deleteMany();

    const users = [
      {
        name: 'HOD Admin',
        email: 'hod@college.edu',
        password: 'admin123',
        role: 'hod',
        department: 'CSE',
      },
      {
        name: 'Faculty Member',
        email: 'faculty@college.edu',
        password: 'faculty123',
        role: 'faculty',
        department: 'CSE',
      },
      {
        name: 'Class Incharge',
        email: 'incharge@college.edu',
        password: 'incharge123',
        role: 'class_incharge',
        department: 'CSE',
      },
    ];

    const createdUsers = [];
    for (const user of users) {
      const createdUser = await User.create(user);
      createdUsers.push(createdUser);
    }
    const hodId = createdUsers[0]._id;

    // Create student user separately because it has a register number
    const studentUser = await User.create({
      name: 'Demo Student',
      email: 'student@college.edu',
      password: 'student123',
      role: 'student',
      department: 'CSE',
      registerNumber: 'CS2023001',
      createdBy: hodId,
    });

    await Student.create({
      name: 'Demo Student',
      email: 'student@college.edu',
      password: 'student123',
      department: 'CSE',
      registerNumber: 'CS2023001',
      userId: studentUser._id,
      createdBy: hodId,
    });

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
