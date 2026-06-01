import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all users for chat list
// @route   GET /api/chat/users
export const getChatUsers = async (req, res) => {
  try {
    let query = { _id: { $ne: req.user._id } };
    
    // Students can only see faculty, HOD, and class incharge
    if (req.user.role === 'student') {
      query.role = { $in: ['faculty', 'hod', 'class_incharge'] };
    }

    const users = await User.find(query)
      .select('name role email')
      .lean();
    res.json({
      success: true,
      message: 'Chat users retrieved successfully',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Get conversation history between current user and another
// @route   GET /api/chat/:userId
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    });

    if (!conversation) {
      return res.json({
        success: true,
        message: 'No messages found',
        data: []
      });
    }

    const messages = await Message.find({ 
      conversationId: conversation._id,
      deletedFor: { $ne: req.user._id } // Don't return messages the user has deleted for themselves
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      message: 'Conversation history retrieved successfully',
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Send a message
// @route   POST /api/chat/:userId
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId]
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text,
      readBy: [req.user._id]
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/message/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body; // 'me' or 'everyone'

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (type === 'everyone') {
      // Only the sender can delete for everyone
      if (message.senderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete for everyone' });
      }
      message.isDeleted = true;
      // We could also clear the text to save space/privacy
      // message.text = 'This message was deleted';
      await message.save();
    } else {
      // Delete for me
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.json({
      success: true,
      message: `Message deleted for ${type}`,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [error.message]
    });
  }
};
