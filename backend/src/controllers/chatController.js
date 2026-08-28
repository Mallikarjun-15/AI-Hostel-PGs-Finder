const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// @desc    Get chat history between two users
// @route   GET /api/chats/:userId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const chats = await Chat.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all conversations for the current user
// @route   GET /api/chats/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Aggregate to find unique users the current user has chatted with
    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", currentUserId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiverId", currentUserId] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
          "user.name": 1,
          "user.profileImage": 1,
          "user.email": 1
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send a message (also handled via socket, but this is the REST fallback/initializer)
// @route   POST /api/chats
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, propertyId } = req.body;
    const senderId = req.user._id;

    const chat = new Chat({
      senderId,
      receiverId,
      message,
      propertyId,
    });

    const savedChat = await chat.save();

    // Create a notification for the receiver
    await Notification.create({
      userId: receiverId,
      message: `New message from ${req.user.name}`,
      type: 'chat',
    });

    res.status(201).json(savedChat);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  getConversations,
};
