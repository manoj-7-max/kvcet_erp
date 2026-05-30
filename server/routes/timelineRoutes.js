import express from 'express';
import { getGoals, createGoal, getTimeline, createTimelineEvent } from '../controllers/timelineController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/goals')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route('/')
  .get(protect, getTimeline)
  .post(protect, createTimelineEvent);

export default router;
