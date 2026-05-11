const express = require('express');
const router = express.Router();
const { askAI, taskSummary } = require('../controllers/aiController');

// POST /api/ai/ask          — general AI chat
router.post('/ask', askAI);

// POST /api/ai/task-summary — structured JSON daily summary
router.post('/task-summary', taskSummary);

module.exports = router;
