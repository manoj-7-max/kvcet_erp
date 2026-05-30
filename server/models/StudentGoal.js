import mongoose from 'mongoose';

const studentGoalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Achieved', 'Abandoned'],
      default: 'Not Started',
    }
  },
  { timestamps: true }
);

const StudentGoal = mongoose.model('StudentGoal', studentGoalSchema);
export default StudentGoal;
