import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get all users for chat list
// @route   GET /api/chat/users
export const getChatUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name role email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
      return res.json([]);
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
