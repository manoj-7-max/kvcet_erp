import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

// @desc    Create new complaint
// @route   POST /api/portal/complaint
// @access  Private
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, type, location } = req.body;
    
    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      type: type || 'complaint',
      submittedBy: req.user._id,
      location,
    });

    // Notify HOD room about new complaint
    const io = req.app.get('io');
    const notification = await Notification.create({
      recipientId: req.user._id, // Ideally HOD role or all HODs, but for now we broadcast to 'hod' room.
      title: `New ${complaint.type} submitted`,
      message: `${req.user.name} submitted a new ${complaint.category} ${complaint.type}.`,
      type: 'complaint',
    });
    
    io.to('hod').emit('notification:new', {
      _id: notification._id,
      title: `New ${complaint.type} submitted`,
      message: `${req.user.name} submitted a new ${complaint.category} ${complaint.type}.`,
      type: 'complaint',
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complaints
// @route   GET /api/portal/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    let complaints;
    if (req.user.role === 'hod' || req.user.role === 'class_incharge') {
      complaints = await Complaint.find({}).populate('submittedBy', 'name role department').sort({ createdAt: -1 });
    } else {
      // Faculty and Student can only see their own
      complaints = await Complaint.find({ submittedBy: req.user._id }).populate('submittedBy', 'name role department').sort({ createdAt: -1 });
    }
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update complaint
// @route   PUT /api/portal/complaint/:id
// @access  Private
export const updateComplaint = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (comment) {
      complaint.comments.push({
        user: req.user._id,
        text: comment,
      });
    }

    await complaint.save();

    const io = req.app.get('io');
    io.to(complaint.submittedBy.toString()).emit('notification:new', {
      title: `Complaint Updated`,
      message: `Your complaint "${complaint.title}" has been updated.`,
      type: 'complaint'
    });
    io.to(complaint.submittedBy.toString()).emit('complaint:updated', complaint);

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
