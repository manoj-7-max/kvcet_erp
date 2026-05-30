import RequestModel from '../models/Request.js';
import Notification from '../models/Notification.js';

// @desc    Create new request
// @route   POST /api/requests
// @access  Private (Student)
export const createRequest = async (req, res) => {
  try {
    const { type, title, description, startDate, endDate } = req.body;
    
    const request = await RequestModel.create({
      studentId: req.user._id,
      type,
      title,
      description,
      startDate,
      endDate,
    });

    // Notify faculty room
    const io = req.app.get('io');
    const notification = await Notification.create({
      recipientId: req.user._id, // Will be ignored by room broadcast if handled manually, or we can broadcast a generic one
      title: 'New Student Request',
      message: `${req.user.name} submitted a new ${type} request.`,
      type: 'request',
    });
    
    // Broadcast to faculty
    io.to('faculty').emit('notification:new', {
      _id: notification._id,
      title: 'New Student Request',
      message: `${req.user.name} submitted a new ${type} request.`,
      type: 'request',
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get requests
// @route   GET /api/requests
// @access  Private
export const getRequests = async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'student') {
      requests = await RequestModel.find({ studentId: req.user._id }).populate('studentId', 'name registerNumber department').sort({ createdAt: -1 });
    } else if (req.user.role === 'faculty') {
      requests = await RequestModel.find({ status: 'Pending' }).populate('studentId', 'name registerNumber department').sort({ createdAt: -1 });
    } else if (req.user.role === 'hod') {
      requests = await RequestModel.find({}).populate('studentId', 'name registerNumber department').sort({ createdAt: -1 });
    } else {
      requests = [];
    }
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private (Faculty, HOD)
export const updateRequestStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const request = await RequestModel.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role === 'faculty') {
      request.status = status; // Faculty_Approved, Faculty_Rejected
      request.facultyComments = comments;
      await request.save();

      const io = req.app.get('io');
      
      if (status === 'Faculty_Approved') {
        io.to('hod').emit('notification:new', {
          title: 'Request Approved by Faculty',
          message: `A request needs your final approval.`,
          type: 'request'
        });
      }

      // Notify student
      io.to(request.studentId.toString()).emit('notification:new', {
        title: 'Request Update',
        message: `Your request is now ${status.replace('_', ' ')}.`,
        type: 'request'
      });
      io.to(request.studentId.toString()).emit('request:updated', request);

    } else if (req.user.role === 'hod') {
      request.status = status; // HOD_Approved, HOD_Rejected
      request.hodComments = comments;
      await request.save();

      const io = req.app.get('io');
      
      // Notify student
      io.to(request.studentId.toString()).emit('notification:new', {
        title: 'Final Decision on Request',
        message: `Your request was ${status.replace('_', ' ')} by the HOD.`,
        type: 'request'
      });
      io.to(request.studentId.toString()).emit('request:updated', request);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
