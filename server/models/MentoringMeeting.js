import mongoose from 'mongoose';

const mentoringMeetingSchema = new mongoose.Schema(
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
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    summary: {
      type: String,
    }
  },
  { timestamps: true }
);

const MentoringMeeting = mongoose.model('MentoringMeeting', mentoringMeetingSchema);
export default MentoringMeeting;
