const express = require('express');
const router = express.Router();
const { recommendProperties, chatBot } = require('../controllers/aiController');

router.post('/recommend', recommendProperties);
router.post('/chat', chatBot);

module.exports = router;
