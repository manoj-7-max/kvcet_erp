import express from 'express';
import { createRequest, getRequests, updateRequestStatus } from '../controllers/requestController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest, requestSchema } from '../middlewares/validation.js';

const router = express.Router();

router.route('/')
  .post(protect, validateRequest(requestSchema), createRequest)
  .get(protect, getRequests);

router.route('/:id/status')
  .put(protect, updateRequestStatus);

export default router;
