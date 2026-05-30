import mongoose from 'mongoose';

const mentoringFeedbackSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentoringMeeting',
      required: true,
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feedbackText: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    }
  },
  { timestamps: true }
);

const MentoringFeedback = mongoose.model('MentoringFeedback', mentoringFeedbackSchema);
export default MentoringFeedback;
