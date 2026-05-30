import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    academicYear: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

const Mentor = mongoose.model('Mentor', mentorSchema);
export default Mentor;
