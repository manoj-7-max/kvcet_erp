import express from 'express';
import { createCircular, getCirculars } from '../controllers/circularController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createCircular)
  .get(protect, getCirculars);

export default router;
