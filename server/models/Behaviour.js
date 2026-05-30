import mongoose from 'mongoose';

const behaviourSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['positive', 'negative'],
      required: true,
    },
    incident: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    actionTaken: {
      type: String,
    }
  },
  { timestamps: true }
);

const Behaviour = mongoose.model('Behaviour', behaviourSchema);
export default Behaviour;
