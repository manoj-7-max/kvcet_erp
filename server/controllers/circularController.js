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
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create circulars',
        errors: []
      });
    }

    // Deadline validation
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline date format',
          errors: []
        });
      }
      if (deadlineDate < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({
          success: false,
          message: 'Deadline date cannot be in the past',
          errors: []
        });
      }
    }

    const circular = await Circular.create({
      title,
      category,
      description,
      event_date: event_date || undefined,
      deadline: deadline || undefined,
      location,
      organizer,
      attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      createdBy: req.user._id,
    });

    const io = req.app.get('io');
    if (io) {
      // Broadcast to everyone
      io.emit('circular:new', circular);
      io.emit('notification:new', {
        title: `New Circular: ${title}`,
        message: `A new circular has been published in ${category}.`,
        type: 'circular'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Circular published successfully',
      data: circular
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get circulars
// @route   GET /api/circulars
// @access  Private
export const getCirculars = async (req, res) => {
  try {
    const circulars = await Circular.find({})
      .populate('createdBy', 'name role department')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Circulars retrieved successfully',
      data: circulars
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
