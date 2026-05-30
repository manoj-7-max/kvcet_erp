import mongoose from 'mongoose';

const mentorNoteSchema = new mongoose.Schema(
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
    note: {
      type: String,
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: true, // If true, mentee cannot see it
    }
  },
  { timestamps: true }
);

const MentorNote = mongoose.model('MentorNote', mentorNoteSchema);
export default MentorNote;
