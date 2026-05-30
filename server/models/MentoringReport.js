import mongoose from 'mongoose';

const mentoringReportSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    flagged: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const MentoringReport = mongoose.model('MentoringReport', mentoringReportSchema);
export default MentoringReport;
