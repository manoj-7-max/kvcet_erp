import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['leave', 'bonafide', 'onduty', 'other'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Faculty_Approved', 'Faculty_Rejected', 'HOD_Approved', 'HOD_Rejected', 'Closed'],
      default: 'Pending',
    },
    facultyComments: {
      type: String,
      default: '',
    },
    hodComments: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });

const RequestModel = mongoose.model('Request', requestSchema);
export default RequestModel;
