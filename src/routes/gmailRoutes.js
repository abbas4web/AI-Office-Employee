const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGmailAuthUrl,
  handleCallback,
  getStatus,
  getEmails,
  analyzeEmail,
  emailToTask,
  disconnect,
} = require('../controllers/gmailController');

// GET  /api/gmail/auth-url     — get Google OAuth URL (protected)
router.get('/auth-url', protect, getGmailAuthUrl);

// GET  /api/gmail/callback     — OAuth callback from Google (PUBLIC — Google redirects here)
router.get('/callback', handleCallback);

// GET  /api/gmail/status       — check if Gmail is connected (protected)
router.get('/status', protect, getStatus);

// GET  /api/gmail/emails       — list recent emails (protected)
router.get('/emails', protect, getEmails);

// POST /api/gmail/emails/analyze  — AI analysis before task creation
router.post('/emails/analyze', protect, analyzeEmail);

// POST /api/gmail/emails/to-task   — convert email to task (with optional AI data)
router.post('/emails/to-task', protect, emailToTask);

// DELETE /api/gmail/disconnect — remove Gmail connection (protected)
router.delete('/disconnect', protect, disconnect);

module.exports = router;
