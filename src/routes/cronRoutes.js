const express = require('express');
const router = express.Router();
const { processReminders } = require('../controllers/cronController');

// GET /api/cron/process-reminders
// This endpoint is called by Vercel Cron
router.get('/process-reminders', processReminders);

module.exports = router;
