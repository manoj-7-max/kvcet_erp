import express from 'express';
import { markAttendance, getAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, markAttendance)
  .get(protect, getAttendance);

export default router;
