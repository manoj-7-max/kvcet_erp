import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['hod', 'faculty', 'class_incharge', 'student'],
    required: true 
  },
  department: { type: String },
  employeeId: { type: String },
  registerNumber: { type: String, sparse: true, unique: true }, // sparse because not all users are students
  phone: { type: String },
  bio: { type: String, maxLength: 500 },
  dateOfBirth: { type: Date },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom' }]
}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
