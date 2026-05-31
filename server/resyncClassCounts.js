import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ClassRoom from './models/ClassRoom.js';
import Student from './models/Student.js';

dotenv.config();

const resyncCounts = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();

    console.log('🔄 Fetching all classrooms...');
    const classrooms = await ClassRoom.find();
    
    for (const cls of classrooms) {
      const actualCount = await Student.countDocuments({ classId: cls._id });
      console.log(`Class ${cls.className}: Expected ${cls.studentsCount}, Actual ${actualCount}`);
      
      if (cls.studentsCount !== actualCount) {
        cls.studentsCount = actualCount;
        await cls.save();
        console.log(`✅ Updated Class ${cls.className} to ${actualCount} students.`);
      }
    }

    console.log('🎉 Resync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during resync:', error);
    process.exit(1);
  }
};

resyncCounts();
