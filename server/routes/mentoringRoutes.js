import express from 'express';
import { getMentees, scheduleMeeting, getMeetings, getTasks } from '../controllers/mentoringController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/mentees').get(protect, getMentees);
router.route('/meetings')
  .post(protect, scheduleMeeting)
  .get(protect, getMeetings);
  
router.route('/tasks').get(protect, getTasks);

export default router;
