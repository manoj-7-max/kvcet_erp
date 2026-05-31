import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

// @desc    Create new complaint/feedback
// @route   POST /api/portal/complaint
// @access  Private
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, type, location } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      type: req.user.role === 'student' ? 'feedback' : (type || 'complaint'),
      submittedBy: req.user._id,
      location,
    });

    const io = req.app.get('io');
    const notification = await Notification.create({
      recipientId: req.user._id,
      title: `New ${complaint.type} submitted`,
      message: `${req.user.name} submitted a new ${complaint.category} ${complaint.type}.`,
      type: 'complaint',
    });

    if (io) {
      io.to('hod').emit('notification:new', {
        _id: notification._id,
        title: `New ${complaint.type} submitted`,
        message: `${req.user.name} submitted a new ${complaint.category} ${complaint.type}.`,
        type: 'complaint',
      });
    }

    res.status(201).json({
      success: true,
      message: `${complaint.type === 'feedback' ? 'Feedback' : 'Complaint'} submitted successfully`,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get complaints
// @route   GET /api/portal/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'hod' || req.user.role === 'class_incharge') {
      // HOD and Class Incharge can see all
      if (req.query.type) {
        query.type = req.query.type;
      }
    } else if (req.user.role === 'faculty') {
      // Faculty sees their own complaints
      query.submittedBy = req.user._id;
      if (req.query.type) {
        query.type = req.query.type;
      }
    } else if (req.user.role === 'student') {
      // Students see only their own feedback
      query.submittedBy = req.user._id;
      query.type = 'feedback';
    }

    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'name role department')
      .populate('comments.user', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Update complaint status & save comments
// @route   PUT /api/portal/complaint/:id
// @access  Private
export const updateComplaint = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
        errors: []
      });
    }

    if (status) complaint.status = status;
    if (comment) {
      complaint.comments.push({
        user: req.user._id,
        text: comment,
      });
    }

    await complaint.save();

    // Populate comments user again for response
    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('submittedBy', 'name role department')
      .populate('comments.user', 'name role')
      .lean();

    const io = req.app.get('io');
    if (io) {
      io.to(complaint.submittedBy.toString()).emit('notification:new', {
        title: `Complaint Updated`,
        message: `Your complaint "${complaint.title}" has been updated.`,
        type: 'complaint'
      });
      io.to(complaint.submittedBy.toString()).emit('complaint:updated', updatedComplaint);
    }

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
