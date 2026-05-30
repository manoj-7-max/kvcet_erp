import mongoose from 'mongoose';

const internalMarkSchema = new mongoose.Schema(
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
    assessmentType: {
      type: String,
      required: true,
    },
    marksScored: {
      type: Number,
      required: true,
    },
    maximumMarks: {
      type: Number,
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

const InternalMark = mongoose.model('InternalMark', internalMarkSchema);
export default InternalMark;
