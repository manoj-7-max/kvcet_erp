import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserStatus,
  deleteUser,
} from '../controllers/hodController.js';
import { protect, hodOnly } from '../middlewares/authMiddleware.js';
import { validateRequest, userCreateSchema } from '../middlewares/validation.js';

const router = express.Router();

router.use(protect, hodOnly);

router.route('/users')
  .get(getUsers)
  .post(validateRequest(userCreateSchema), createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/password', resetUserPassword);
router.put('/users/:id/status', updateUserStatus);

export default router;
