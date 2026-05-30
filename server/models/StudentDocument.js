import mongoose from 'mongoose';

const studentDocumentSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['Certificate', 'ID Proof', 'Medical', 'Academic', 'Other'],
      default: 'Other',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    mimeType: {
      type: String,
    }
  },
  { timestamps: true }
);

const StudentDocument = mongoose.model('StudentDocument', studentDocumentSchema);
export default StudentDocument;
