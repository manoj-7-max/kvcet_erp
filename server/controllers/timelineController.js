import StudentGoal from '../models/StudentGoal.js';
import TimelineEvent from '../models/TimelineEvent.js';

export const getGoals = async (req, res) => {
  try {
    const goals = await StudentGoal.find({ studentId: req.user._id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createGoal = async (req, res) => {
  try {
    const goal = await StudentGoal.create({ ...req.body, studentId: req.user._id });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const events = await TimelineEvent.find({ studentId: req.user._id }).sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTimelineEvent = async (req, res) => {
  try {
    const event = await TimelineEvent.create({ ...req.body, studentId: req.user._id });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
