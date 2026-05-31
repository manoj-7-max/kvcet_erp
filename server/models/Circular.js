import mongoose from 'mongoose';

const circularSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['academic', 'event', 'holiday', 'exam', 'general'],
      default: 'general',
    },
    description: {
      type: String,
      required: true,
    },
    event_date: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    location: {
      type: String,
    },
    organizer: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachmentUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Circular = mongoose.model('Circular', circularSchema);
export default Circular;
