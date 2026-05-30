import express from 'express';
import { 
  addAcademicRecord, getAcademicRecords, 
  addInternalMarks, getInternalMarks,
  addDailyTests, getDailyTests
} from '../controllers/academicController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/records')
  .post(protect, addAcademicRecord)
  .get(protect, getAcademicRecords);

router.route('/internal-marks')
  .post(protect, addInternalMarks)
  .get(protect, getInternalMarks);

router.route('/daily-tests')
  .post(protect, addDailyTests)
  .get(protect, getDailyTests);

export default router;
