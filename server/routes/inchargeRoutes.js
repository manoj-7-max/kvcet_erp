import express from 'express';
import {
  getInchargeClasses,
  getClassStudents,
  addStudent,
  editStudent,
  deleteStudent,
  importCSV
} from '../controllers/inchargeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest, studentCreateSchema } from '../middlewares/validation.js';

const router = express.Router();

// Middleware to authorize only Class Incharge or HOD
const inchargeOrHod = (req, res, next) => {
  if (req.user && (req.user.role === 'class_incharge' || req.user.role === 'hod')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized: Access restricted to Class Incharges and HOD',
      errors: []
    });
  }
};

router.use(protect, inchargeOrHod);

router.get('/classes', getInchargeClasses);

router.route('/classes/:classId/students')
  .get(getClassStudents)
  .post(validateRequest(studentCreateSchema), addStudent);

router.post('/classes/:classId/import', importCSV);

router.route('/students/:id')
  .put(validateRequest(studentCreateSchema.partial()), editStudent)
  .delete(deleteStudent);

export default router;
