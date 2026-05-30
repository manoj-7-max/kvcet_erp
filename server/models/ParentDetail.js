import mongoose from 'mongoose';

const parentDetailSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fatherName: {
      type: String,
    },
    fatherOccupation: {
      type: String,
    },
    fatherPhone: {
      type: String,
    },
    motherName: {
      type: String,
    },
    motherOccupation: {
      type: String,
    },
    motherPhone: {
      type: String,
    },
    address: {
      type: String,
    }
  },
  { timestamps: true }
);

const ParentDetail = mongoose.model('ParentDetail', parentDetailSchema);
export default ParentDetail;
