import express from 'express';
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  assignIncharge,
  transferIncharge,
  transferStudent,
  promoteClass,
} from '../controllers/classRoomController.js';
import { protect, hodOnly } from '../middlewares/authMiddleware.js';
import { validateRequest, classRoomCreateSchema } from '../middlewares/validation.js';

const router = express.Router();

// All classroom endpoints are protected and restricted to HOD
router.use(protect, hodOnly);

router.route('/')
  .get(getClasses)
  .post(validateRequest(classRoomCreateSchema), createClass);

router.route('/:id')
  .put(updateClass)
  .delete(deleteClass);

router.put('/:id/incharge', assignIncharge);
router.put('/:id/transfer-incharge', transferIncharge);
router.put('/student-transfer/:studentId', transferStudent);
router.post('/promote-class/:classId', promoteClass);

export default router;
