import express from 'express';
import { loginUser, getProfile, updateProfile } from '../controllers/authController.js';
import { validateRequest, loginSchema } from '../middlewares/validation.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), loginUser);
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;
