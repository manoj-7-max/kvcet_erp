import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries -= 1;
      console.error(`Database connection failed. Retries left: ${retries}. Error: ${error.message}`);
      if (retries === 0) {
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export default connectDB;
