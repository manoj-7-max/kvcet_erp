import RequestModel from '../models/Request.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create new request
// @route   POST /api/requests
// @access  Private (Student)
export const createRequest = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit requests',
        errors: []
      });
    }

    const { type, title, description, startDate, endDate } = req.body;

    const request = await RequestModel.create({
      studentId: req.user._id,
      type,
      title,
      description,
      startDate,
      endDate,
    });

    const io = req.app.get('io');
    const notification = await Notification.create({
      recipientId: req.user._id,
      title: 'New Student Request',
      message: `${req.user.name} submitted a new ${type} request.`,
      type: 'request',
    });

    // Broadcast to faculty room
    if (io) {
      io.to('faculty').emit('notification:new', {
        _id: notification._id,
        title: 'New Student Request',
        message: `${req.user.name} submitted a new ${type} request.`,
        type: 'request',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get requests with pagination, filtering, and search
// @route   GET /api/requests
// @access  Private
export const getRequests = async (req, res) => {
  try {
    let query = {};

    // Role checks
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (req.user.role === 'faculty') {
      // Faculty reviews Pending requests
      query.status = { $in: ['Pending', 'Faculty_Approved', 'Faculty_Rejected'] };
    } else if (req.user.role === 'hod') {
      // HOD sees all
    } else {
      return res.json({
        success: true,
        message: 'Requests retrieved successfully',
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      });
    }

    // Filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Search by title or student name
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      // Search inside title OR find matching student IDs by name
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const studentIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { title: searchRegex },
        { studentId: { $in: studentIds } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // default large limit to match existing view sizes
    const skip = (page - 1) * limit;

    const total = await RequestModel.countDocuments(query);
    const requests = await RequestModel.find(query)
      .populate('studentId', 'name registerNumber department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      message: 'Requests retrieved successfully',
      data: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
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
      return res.status(404).json({
        success: false,
        message: 'Request not found',
        errors: []
      });
    }

    // Prevent transitions on finalized/closed requests
    if (['HOD_Approved', 'HOD_Rejected', 'Closed'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a finalized or closed request',
        errors: []
      });
    }

    const io = req.app.get('io');

    if (req.user.role === 'faculty') {
      // Faculty validation: only transition from Pending to Faculty_Approved or Faculty_Rejected
      if (request.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Faculty can only evaluate Pending requests',
          errors: []
        });
      }

      if (!['Faculty_Approved', 'Faculty_Rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state transition for Faculty',
          errors: []
        });
      }

      request.status = status;
      request.facultyComments = comments || '';
      await request.save();

      if (io) {
        if (status === 'Faculty_Approved') {
          io.to('hod').emit('notification:new', {
            title: 'Request Approved by Faculty',
            message: `A request from student is forwarded for your final HOD approval.`,
            type: 'request'
          });
        }

        // Notify student
        io.to(request.studentId.toString()).emit('notification:new', {
          title: 'Request Evaluated',
          message: `Your request status has been updated to ${status.replace('_', ' ')} by Faculty.`,
          type: 'request'
        });
        io.to(request.studentId.toString()).emit('request:updated', request);
      }

    } else if (req.user.role === 'hod') {
      // HOD validation: transition from Pending or Faculty_Approved to HOD_Approved or HOD_Rejected
      if (!['Pending', 'Faculty_Approved'].includes(request.status)) {
        return res.status(400).json({
          success: false,
          message: 'HOD can only evaluate Pending or Faculty Approved requests',
          errors: []
        });
      }

      if (!['HOD_Approved', 'HOD_Rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state transition for HOD',
          errors: []
        });
      }

      request.status = status;
      request.hodComments = comments || '';
      await request.save();

      if (io) {
        // Notify student
        io.to(request.studentId.toString()).emit('notification:new', {
          title: 'Final HOD Decision',
          message: `Your request was officially ${status.replace('_', ' ')} by the HOD.`,
          type: 'request'
        });
        io.to(request.studentId.toString()).emit('request:updated', request);
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve requests',
        errors: []
      });
    }

    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
