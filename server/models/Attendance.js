import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    // Common Fields
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registerNumber: {
      type: String,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassRoom',
    },

    // Daily Attendance Import Fields
    attendanceDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'OD', 'Leave'],
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    month: {
      type: String, // e.g. "March" or "March 2026"
    },
    year: {
      type: Number, // e.g. 2026
    },

    // Legacy / Subject-wise Cumulative Attendance Fields (Optional)
    subjectCode: {
      type: String,
    },
    subjectName: {
      type: String,
    },
    totalClasses: {
      type: Number,
      default: 0,
    },
    classesAttended: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for high performance
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ attendanceDate: 1 });
attendanceSchema.index({ classId: 1 });
// Compound index to speed up daily duplicate checks
attendanceSchema.index({ studentId: 1, attendanceDate: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
