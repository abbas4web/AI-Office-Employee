const {
  getAuthURL,
  exchangeCodeAndSave,
  readEmails,
  getConnectionStatus,
  disconnectGmail,
} = require('../services/gmailService');
const { convertEmailToTask } = require('../services/emailToTask');

/**
 * GET /api/gmail/auth-url
 * Returns the Google OAuth URL for the logged-in user.
 */
const getGmailAuthUrl = (req, res) => {
  const url = getAuthURL(req.user.id);
  res.json({ success: true, url });
};

/**
 * GET /api/gmail/callback
 * Google redirects here after user grants permission.
 * Exchanges the code for tokens and saves to DB.
 * Then redirects user back to the frontend Gmail page.
 */
const handleCallback = async (req, res, next) => {
  try {
    const { code, state: userId, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/gmail?error=access_denied`
      );
    }

    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/gmail?error=missing_params`);
    }

    await exchangeCodeAndSave(code, userId);
    res.redirect(`${process.env.FRONTEND_URL}/gmail?connected=true`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/gmail/status
 * Returns whether the logged-in user has Gmail connected.
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await getConnectionStatus(req.user.id);
    res.json({ success: true, ...status });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/gmail/emails
 * Returns the user's recent unread emails.
 * Query params: limit (default 15), q (search query)
 */
const getEmails = async (req, res, next) => {
  try {
    const { limit = 15, q } = req.query;
    const emails = await readEmails(req.user.id, parseInt(limit), q);
    res.json({ success: true, emails, total: emails.length });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/gmail/emails/to-task
 * Converts a provided email object into a task.
 * Body: { email: { sender_name, sender_email, subject, snippet } }
 */
const emailToTask = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.subject) {
      const err = new Error('Email data is required');
      err.statusCode = 400;
      return next(err);
    }

    const task = await convertEmailToTask(email, req.user.id);
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/gmail/disconnect
 * Removes the user's stored Gmail tokens.
 */
const disconnect = async (req, res, next) => {
  try {
    await disconnectGmail(req.user.id);
    res.json({ success: true, message: 'Gmail disconnected successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGmailAuthUrl, handleCallback, getStatus, getEmails, emailToTask, disconnect };
