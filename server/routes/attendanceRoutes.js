import express from 'express';
import multer from 'multer';
import { 
  markAttendance, 
  getAttendance, 
  importAttendance,
  getAttendanceAnalytics,
  getHODAttendanceAnalytics
} from '../controllers/attendanceController.js';
import { protect, hodOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Legacy Subject-Wise aggregate endpoints
router.route('/')
  .post(protect, markAttendance)
  .get(protect, getAttendance);

// HOD Comparative Departmental Analytics
router.get('/hod/analytics', protect, hodOnly, getHODAttendanceAnalytics);

// Daily CSV Import & Classroom Analytics
router.post(
  '/class/:classId/import-attendance',
  protect,
  upload.single('file'),
  importAttendance
);

router.get(
  '/class/:classId/analytics',
  protect,
  getAttendanceAnalytics
);

export default router;
