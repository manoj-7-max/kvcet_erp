import Mentor from '../models/Mentor.js';
import MentoringMeeting from '../models/MentoringMeeting.js';
import MentoringTask from '../models/MentoringTask.js';
import MentorNote from '../models/MentorNote.js';
import MentoringReport from '../models/MentoringReport.js';
import MentoringFeedback from '../models/MentoringFeedback.js';
import StudentGoal from '../models/StudentGoal.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// ─────────────────────────────────────────────────────────────────
// MENTOR / MENTEE ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────

// @desc    Get mentor's assigned mentees
// @route   GET /api/mentoring/mentees
// @access  Faculty
export const getMentees = async (req, res) => {
  try {
    const mentorRec = await Mentor.findOne({ facultyId: req.user._id })
      .populate('mentees', 'name registerNumber email phone department');
    if (!mentorRec) return res.json([]);
    res.json(mentorRec.mentees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student's assigned mentor info
// @route   GET /api/mentoring/my-mentor
// @access  Student
export const getMyMentorInfo = async (req, res) => {
  try {
    const mentorRec = await Mentor.findOne({ mentees: req.user._id })
      .populate('facultyId', 'name email phone department employeeId');
    if (!mentorRec) return res.json(null);
    res.json(mentorRec.facultyId);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a mentee's detailed profile (for faculty view)
// @route   GET /api/mentoring/mentee/:id/profile
// @access  Faculty
export const getMenteeProfile = async (req, res) => {
  try {
    const mentee = await User.findById(req.params.id).select('-password');
    if (!mentee) return res.status(404).json({ message: 'Mentee not found' });

    // Verify this faculty is actually the mentor of this student
    const mentorRec = await Mentor.findOne({
      facultyId: req.user._id,
      mentees: req.params.id,
    });
    if (!mentorRec) return res.status(403).json({ message: 'Not authorized for this mentee' });

    // Aggregate attendance summary
    const attendanceRecords = await Attendance.find({ studentId: mentee._id });
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'OD').length;
    const attendancePct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : null;

    // Meetings with this mentee
    const meetings = await MentoringMeeting.find({
      mentorId: req.user._id,
      menteeId: req.params.id,
    }).sort({ scheduledDate: -1 }).limit(5);

    // Tasks assigned to mentee
    const tasks = await MentoringTask.find({
      mentorId: req.user._id,
      menteeId: req.params.id,
    }).sort({ createdAt: -1 });

    // Goals
    const goals = await StudentGoal.find({ studentId: req.params.id });

    res.json({
      student: mentee,
      attendanceSummary: { total: totalClasses, present: presentClasses, percentage: attendancePct },
      recentMeetings: meetings,
      tasks,
      goals,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// MEETINGS
// ─────────────────────────────────────────────────────────────────

// @desc    Schedule a meeting
// @route   POST /api/mentoring/meetings
// @access  Faculty
export const scheduleMeeting = async (req, res) => {
  try {
    const meeting = await MentoringMeeting.create({ ...req.body, mentorId: req.user._id });
    const populated = await MentoringMeeting.findById(meeting._id)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all meetings for the logged-in user
// @route   GET /api/mentoring/meetings
// @access  Faculty / Student
export const getMeetings = async (req, res) => {
  try {
    const query = req.user.role === 'student'
      ? { menteeId: req.user._id }
      : { mentorId: req.user._id };
    const meetings = await MentoringMeeting.find(query)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name')
      .sort({ scheduledDate: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update meeting status / add summary
// @route   PUT /api/mentoring/meetings/:id
// @access  Faculty
export const updateMeeting = async (req, res) => {
  try {
    const meeting = await MentoringMeeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { status, summary, title, scheduledDate } = req.body;
    if (status) meeting.status = status;
    if (summary !== undefined) meeting.summary = summary;
    if (title) meeting.title = title;
    if (scheduledDate) meeting.scheduledDate = scheduledDate;
    await meeting.save();
    const populated = await MentoringMeeting.findById(meeting._id)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a meeting
// @route   DELETE /api/mentoring/meetings/:id
// @access  Faculty
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await MentoringMeeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await meeting.deleteOne();
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────

// @desc    Create a task for a mentee
// @route   POST /api/mentoring/tasks
// @access  Faculty
export const createTask = async (req, res) => {
  try {
    const task = await MentoringTask.create({ ...req.body, mentorId: req.user._id });
    const populated = await MentoringTask.findById(task._id)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tasks (faculty sees all their tasks; student sees their tasks)
// @route   GET /api/mentoring/tasks
// @access  Faculty / Student
export const getTasks = async (req, res) => {
  try {
    const query = req.user.role === 'student'
      ? { menteeId: req.user._id }
      : { mentorId: req.user._id };
    const tasks = await MentoringTask.find(query)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a task (status, or any field by mentor)
// @route   PUT /api/mentoring/tasks/:id
// @access  Faculty / Student
export const updateTask = async (req, res) => {
  try {
    const task = await MentoringTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Students can only update status
    if (req.user.role === 'student') {
      if (task.menteeId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (req.body.status) task.status = req.body.status;
    } else {
      // Faculty can update everything
      if (task.mentorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { title, description, deadline, status } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (deadline) task.deadline = deadline;
      if (status) task.status = status;
    }

    await task.save();
    const populated = await MentoringTask.findById(task._id)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/mentoring/tasks/:id
// @access  Faculty
export const deleteTask = async (req, res) => {
  try {
    const task = await MentoringTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────────────────────────────

// @desc    Add a note for a mentee
// @route   POST /api/mentoring/notes
// @access  Faculty
export const addNote = async (req, res) => {
  try {
    const { menteeId, note, isPrivate } = req.body;
    const newNote = await MentorNote.create({
      mentorId: req.user._id,
      menteeId,
      note,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
    });
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get notes for a specific mentee
// @route   GET /api/mentoring/notes/:menteeId
// @access  Faculty (all) / Student (only non-private)
export const getNotes = async (req, res) => {
  try {
    const query = { menteeId: req.params.menteeId };
    if (req.user.role === 'student') {
      query.isPrivate = false;
    } else {
      // Faculty only see their own notes
      query.mentorId = req.user._id;
    }
    const notes = await MentorNote.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/mentoring/notes/:id
// @access  Faculty
export const deleteNote = async (req, res) => {
  try {
    const noteDoc = await MentorNote.findById(req.params.id);
    if (!noteDoc) return res.status(404).json({ message: 'Note not found' });
    if (noteDoc.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await noteDoc.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────

// @desc    Create a mentoring report
// @route   POST /api/mentoring/reports
// @access  Faculty
export const createReport = async (req, res) => {
  try {
    const report = await MentoringReport.create({ ...req.body, mentorId: req.user._id });
    const populated = await MentoringReport.findById(report._id)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reports (faculty: own; student: own; HOD: all)
// @route   GET /api/mentoring/reports
// @access  Faculty / Student / HOD
export const getReports = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'faculty' || req.user.role === 'class_incharge') query.mentorId = req.user._id;
    else if (req.user.role === 'student') query.menteeId = req.user._id;
    // HOD sees all

    const reports = await MentoringReport.find(query)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a report
// @route   DELETE /api/mentoring/reports/:id
// @access  Faculty
export const deleteReport = async (req, res) => {
  try {
    const report = await MentoringReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await report.deleteOne();
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// STUDENT GOALS (student self-manages, faculty can view via profile)
// ─────────────────────────────────────────────────────────────────

// @desc    Get student's own goals
// @route   GET /api/mentoring/goals
// @access  Student
export const getGoals = async (req, res) => {
  try {
    const goals = await StudentGoal.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a goal
// @route   POST /api/mentoring/goals
// @access  Student
export const createGoal = async (req, res) => {
  try {
    const goal = await StudentGoal.create({ ...req.body, studentId: req.user._id });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a goal
// @route   PUT /api/mentoring/goals/:id
// @access  Student
export const updateGoal = async (req, res) => {
  try {
    const goal = await StudentGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, description, targetDate, status } = req.body;
    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (targetDate) goal.targetDate = targetDate;
    if (status) goal.status = status;
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/mentoring/goals/:id
// @access  Student
export const deleteGoal = async (req, res) => {
  try {
    const goal = await StudentGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await goal.deleteOne();
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// HOD ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// @desc    HOD overview stats for mentoring
// @route   GET /api/mentoring/hod/overview
// @access  HOD
export const getHODOverview = async (req, res) => {
  try {
    const totalMentors = await Mentor.countDocuments();
    const allMentors = await Mentor.find();
    const totalMentees = allMentors.reduce((acc, m) => acc + m.mentees.length, 0);

    // Meetings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const meetingsThisMonth = await MentoringMeeting.countDocuments({
      scheduledDate: { $gte: startOfMonth },
    });

    const flaggedReports = await MentoringReport.countDocuments({ flagged: true });
    const pendingTasks = await MentoringTask.countDocuments({ status: 'Pending' });
    const completedMeetings = await MentoringMeeting.countDocuments({ status: 'Completed' });

    res.json({
      totalMentors,
      totalMentees,
      meetingsThisMonth,
      flaggedReports,
      pendingTasks,
      completedMeetings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all mentor assignments with populated data
// @route   GET /api/mentoring/hod/assignments
// @access  HOD
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Mentor.find()
      .populate('facultyId', 'name email employeeId department')
      .populate('mentees', 'name registerNumber email department');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign mentees to a faculty mentor (HOD)
// @route   POST /api/mentoring/hod/assign
// @access  HOD
export const assignMentor = async (req, res) => {
  try {
    const { facultyId, menteeIds, academicYear } = req.body;
    if (!facultyId || !menteeIds || !academicYear) {
      return res.status(400).json({ message: 'facultyId, menteeIds, and academicYear are required' });
    }

    let mentorRec = await Mentor.findOne({ facultyId, academicYear });
    if (mentorRec) {
      // Merge mentees without duplicates
      const existing = mentorRec.mentees.map(id => id.toString());
      const toAdd = menteeIds.filter(id => !existing.includes(id));
      mentorRec.mentees.push(...toAdd);
      await mentorRec.save();
    } else {
      mentorRec = await Mentor.create({ facultyId, mentees: menteeIds, academicYear });
    }

    const populated = await Mentor.findById(mentorRec._id)
      .populate('facultyId', 'name email employeeId')
      .populate('mentees', 'name registerNumber email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a mentee from a mentor
// @route   DELETE /api/mentoring/hod/assign
// @access  HOD
export const removeMentee = async (req, res) => {
  try {
    const { mentorRecordId, menteeId } = req.body;
    const mentorRec = await Mentor.findById(mentorRecordId);
    if (!mentorRec) return res.status(404).json({ message: 'Mentor record not found' });
    mentorRec.mentees = mentorRec.mentees.filter(id => id.toString() !== menteeId);
    await mentorRec.save();
    res.json({ message: 'Mentee removed', mentorRec });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all flagged reports (HOD)
// @route   GET /api/mentoring/hod/flagged-reports
// @access  HOD
export const getFlaggedReports = async (req, res) => {
  try {
    const reports = await MentoringReport.find({ flagged: true })
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
