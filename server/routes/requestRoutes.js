import express from 'express';
import { createRequest, getRequests, updateRequestStatus } from '../controllers/requestController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createRequest)
  .get(protect, getRequests);

router.route('/:id/status')
  .put(protect, updateRequestStatus);

export default router;
