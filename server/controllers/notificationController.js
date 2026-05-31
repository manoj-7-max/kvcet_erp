import Notification from '../models/Notification.js';

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
      // Check if this notification belongs to the user
      if (notification.recipientId.toString() !== req.user._id.toString()) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized',
          errors: []
        });
      }

      notification.read = true;
      await notification.save();

      res.json({
        success: true,
        message: 'Notification marked as read successfully',
        data: notification
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found',
        errors: []
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
