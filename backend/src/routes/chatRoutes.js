const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage, getConversations } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, sendMessage);

router.get('/conversations', protect, getConversations);

router.route('/:userId/:propertyId')
  .get(protect, getChatHistory);

router.route('/:userId')
  .get(protect, getChatHistory);

module.exports = router;
