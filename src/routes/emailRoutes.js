const express = require('express');
const router = express.Router();
const { notifyTaskCompletion, notifyReminder, sendCustomEmail } = require('../controllers/emailController');

// POST /api/email/task-completion  → notify task is done (DB lookup by task_id)
router.post('/task-completion', notifyTaskCompletion);

// POST /api/email/reminder         → send reminder email (DB lookup by reminder_id)
router.post('/reminder', notifyReminder);

// POST /api/email/custom           → send directly with provided data
router.post('/custom', sendCustomEmail);

module.exports = router;
