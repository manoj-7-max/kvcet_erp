import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['sports', 'cultural', 'technical', 'club', 'other'],
      default: 'other',
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    points: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
