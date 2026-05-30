import express from 'express';
import { getChatUsers, getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, getChatUsers);
router.route('/:userId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

export default router;
