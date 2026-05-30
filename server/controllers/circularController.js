import Circular from '../models/Circular.js';
import Notification from '../models/Notification.js';

// @desc    Create new circular
// @route   POST /api/circulars
// @access  Private (HOD, Class Incharge)
export const createCircular = async (req, res) => {
  try {
    const { title, category, description, event_date, deadline, location, organizer } = req.body;
    
    // Only allow HOD or Class Incharge
    if (req.user.role !== 'hod' && req.user.role !== 'class_incharge') {
      return res.status(403).json({ message: 'Not authorized to create circulars' });
    }

    const circular = await Circular.create({
      title,
      category,
      description,
      event_date,
      deadline,
      location,
      organizer,
      createdBy: req.user._id,
    });

    const io = req.app.get('io');
    
    // Broadcast to everyone
    io.emit('circular:new', circular);
    io.emit('notification:new', {
      title: `New Circular: ${title}`,
      message: `A new circular has been published in ${category}.`,
      type: 'circular'
    });

    res.status(201).json(circular);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get circulars
// @route   GET /api/circulars
// @access  Private
export const getCirculars = async (req, res) => {
  try {
    const circulars = await Circular.find({}).populate('createdBy', 'name role department').sort({ createdAt: -1 });
    res.json(circulars);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
