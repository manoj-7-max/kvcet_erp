import express from 'express';
import { createComplaint, getComplaints, updateComplaint } from '../controllers/complaintController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest, complaintSchema } from '../middlewares/validation.js';

const router = express.Router();

router.route('/complaint')
  .post(protect, validateRequest(complaintSchema), createComplaint);

router.route('/complaints')
  .get(protect, getComplaints);

router.route('/complaint/:id')
  .put(protect, updateComplaint);

export default router;
