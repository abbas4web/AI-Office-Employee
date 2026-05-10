const express = require('express');
const router = express.Router();
const { getReminders, markAsRead } = require('../controllers/reminderController');

// GET /api/reminders - get all reminders (optionally filter by user_id)
router.get('/', getReminders);

// PATCH /api/reminders/:id - mark reminder as read
router.patch('/:id', markAsRead);

module.exports = router;
