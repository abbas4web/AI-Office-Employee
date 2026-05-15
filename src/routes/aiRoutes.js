const express = require('express');
const router = express.Router();
const { askAI, taskSummary, productivitySuggestions, runWorkflow } = require('../controllers/aiController');

// POST /api/ai/ask          — general AI chat
router.post('/ask', askAI);

// POST /api/ai/task-summary — structured JSON daily summary
router.post('/task-summary', taskSummary);

// POST /api/ai/productivity — priority, risks, workload analysis
router.post('/productivity', productivitySuggestions);

// POST /api/ai/workflow     — full AI Office Employee workflow (tasks + reminders + emails)
router.post('/workflow', runWorkflow);

module.exports = router;
