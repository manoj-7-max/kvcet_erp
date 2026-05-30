import mongoose from 'mongoose';

const dailyTestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    partA: {
      type: Number,
      default: 0,
    },
    partB: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    dateConducted: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

// Pre-save hook to calculate total
dailyTestSchema.pre('save', function (next) {
  this.total = (this.partA || 0) + (this.partB || 0);
  next();
});

const DailyTest = mongoose.model('DailyTest', dailyTestSchema);
export default DailyTest;
