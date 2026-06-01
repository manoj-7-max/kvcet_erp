import express from 'express';
import { getChatUsers, getMessages, sendMessage, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, getChatUsers);
router.route('/:userId')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.delete('/message/:messageId', protect, deleteMessage);

export default router;
