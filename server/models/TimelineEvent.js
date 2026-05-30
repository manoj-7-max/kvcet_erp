import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
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
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['Academic', 'Extracurricular', 'Administrative', 'Disciplinary', 'Other'],
      default: 'Academic',
    },
    date: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);
export default TimelineEvent;
