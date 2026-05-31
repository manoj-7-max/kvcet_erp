import mongoose from 'mongoose';

const classRoomSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true, // prevents duplicate classes (e.g. III CSE A)
    },
    department: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true, // e.g. "2025-2026"
    },
    semester: {
      type: Number,
      required: true,
    },
    inchargeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    studentsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classRoomSchema.index({ className: 1 });
classRoomSchema.index({ inchargeId: 1 });
classRoomSchema.index({ department: 1 });

const ClassRoom = mongoose.model('ClassRoom', classRoomSchema);
export default ClassRoom;
