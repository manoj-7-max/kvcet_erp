import express from 'express';
import {
  getMentees,
  getMyMentorInfo,
  getMenteeProfile,
  scheduleMeeting,
  getMeetings,
  updateMeeting,
  deleteMeeting,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addNote,
  getNotes,
  deleteNote,
  createReport,
  getReports,
  deleteReport,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getHODOverview,
  getAllAssignments,
  assignMentor,
  removeMentee,
  getFlaggedReports,
} from '../controllers/mentoringController.js';
import { protect, hodOnly, facultyOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Mentees / Mentor Info ──────────────────────────────────────────
router.get('/mentees', protect, facultyOnly, getMentees);
router.get('/my-mentor', protect, getMyMentorInfo);
router.get('/mentee/:id/profile', protect, facultyOnly, getMenteeProfile);

// ── Meetings ───────────────────────────────────────────────────────
router.route('/meetings')
  .post(protect, facultyOnly, scheduleMeeting)
  .get(protect, getMeetings);

router.route('/meetings/:id')
  .put(protect, facultyOnly, updateMeeting)
  .delete(protect, facultyOnly, deleteMeeting);

// ── Tasks ──────────────────────────────────────────────────────────
router.route('/tasks')
  .post(protect, facultyOnly, createTask)
  .get(protect, getTasks);

router.route('/tasks/:id')
  .put(protect, updateTask)
  .delete(protect, facultyOnly, deleteTask);

// ── Notes ──────────────────────────────────────────────────────────
router.route('/notes')
  .post(protect, facultyOnly, addNote);

router.route('/notes/:menteeId')
  .get(protect, getNotes);

router.route('/notes/delete/:id')
  .delete(protect, facultyOnly, deleteNote);

// ── Reports ────────────────────────────────────────────────────────
router.route('/reports')
  .post(protect, facultyOnly, createReport)
  .get(protect, getReports);

router.route('/reports/:id')
  .delete(protect, facultyOnly, deleteReport);

// ── Student Goals ──────────────────────────────────────────────────
router.route('/goals')
  .get(protect, getGoals)
  .post(protect, createGoal);

router.route('/goals/:id')
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);

// ── HOD ───────────────────────────────────────────────────────────
router.get('/hod/overview', protect, hodOnly, getHODOverview);
router.get('/hod/assignments', protect, hodOnly, getAllAssignments);
router.post('/hod/assign', protect, hodOnly, assignMentor);
router.delete('/hod/assign', protect, hodOnly, removeMentee);
router.get('/hod/flagged-reports', protect, hodOnly, getFlaggedReports);

export default router;
