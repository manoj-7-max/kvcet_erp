import mongoose from 'mongoose';

const academicRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    assessmentType: {
      type: String,
      required: true,
    },
    subjects: [
      {
        code: String,
        name: String,
        grade: String,
        credits: Number,
      }
    ],
    gpa: {
      type: Number,
    }
  },
  { timestamps: true }
);

const AcademicRecord = mongoose.model('AcademicRecord', academicRecordSchema);
export default AcademicRecord;
