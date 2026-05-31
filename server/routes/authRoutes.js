import express from 'express';
import { loginUser } from '../controllers/authController.js';
import { validateRequest, loginSchema } from '../middlewares/validation.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), loginUser);

export default router;
