import Mentor from '../models/Mentor.js';
import MentoringMeeting from '../models/MentoringMeeting.js';
import User from '../models/User.js';

// @desc    Get mentor assigned mentees
// @route   GET /api/mentoring/mentees
export const getMentees = async (req, res) => {
  try {
    const mentorRec = await Mentor.findOne({ facultyId: req.user._id }).populate('mentees', 'name registerNumber email');
    if (!mentorRec) return res.json([]);
    res.json(mentorRec.mentees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Schedule meeting
// @route   POST /api/mentoring/meetings
export const scheduleMeeting = async (req, res) => {
  try {
    const meeting = await MentoringMeeting.create({ ...req.body, mentorId: req.user._id });
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get meetings
// @route   GET /api/mentoring/meetings
export const getMeetings = async (req, res) => {
  try {
    const query = req.user.role === 'student' ? { menteeId: req.user._id } : { mentorId: req.user._id };
    const meetings = await MentoringMeeting.find(query)
      .populate('menteeId', 'name registerNumber')
      .populate('mentorId', 'name')
      .sort({ scheduledDate: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
