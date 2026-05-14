const { sendTaskCompletionEmail, sendReminderEmail } = require('../services/emailService');
const db = require('../db');

/**
 * POST /api/email/task-completion
 * Body: { task_id, recipient_email }
 * Sends a task completion email. Looks up task details from DB.
 */
const notifyTaskCompletion = async (req, res, next) => {
  try {
    const { task_id, recipient_email } = req.body;

    if (!task_id || !recipient_email) {
      const err = new Error('task_id and recipient_email are required.');
      err.statusCode = 400;
      return next(err);
    }

    // Fetch task + assignee details from DB
    const result = await db.query(
      `SELECT t.title, t.status, t.updated_at, u.name AS assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1`,
      [task_id]
    );

    if (result.rows.length === 0) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      return next(err);
    }

    const task = result.rows[0];

    const info = await sendTaskCompletionEmail(recipient_email, {
      taskTitle:    task.title,
      assigneeName: task.assignee_name,
      completedAt:  new Date(task.updated_at).toLocaleString(),
    });

    res.json({ success: true, message: 'Task completion email sent.', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/email/reminder
 * Body: { reminder_id, recipient_email }
 * Sends a reminder email. Looks up reminder details from DB.
 */
const notifyReminder = async (req, res, next) => {
  try {
    const { reminder_id, recipient_email } = req.body;

    if (!reminder_id || !recipient_email) {
      const err = new Error('reminder_id and recipient_email are required.');
      err.statusCode = 400;
      return next(err);
    }

    // Fetch reminder + linked task details
    const result = await db.query(
      `SELECT r.title, r.message, t.title AS task_title, t.due_date
       FROM reminders r
       LEFT JOIN tasks t ON r.task_id = t.id
       WHERE r.id = $1`,
      [reminder_id]
    );

    if (result.rows.length === 0) {
      const err = new Error('Reminder not found.');
      err.statusCode = 404;
      return next(err);
    }

    const reminder = result.rows[0];

    const info = await sendReminderEmail(recipient_email, {
      reminderTitle: reminder.title,
      message:       reminder.message,
      taskTitle:     reminder.task_title,
      dueDate:       reminder.due_date,
    });

    res.json({ success: true, message: 'Reminder email sent.', messageId: info.messageId });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/email/custom
 * Body: { to, type: 'task_completion' | 'reminder', data: {...} }
 * Sends email directly with provided data (no DB lookup needed).
 */
const sendCustomEmail = async (req, res, next) => {
  try {
    const { to, type, data } = req.body;

    if (!to || !type || !data) {
      const err = new Error('to, type, and data are required.');
      err.statusCode = 400;
      return next(err);
    }

    let info;
    if (type === 'task_completion') {
      info = await sendTaskCompletionEmail(to, data);
    } else if (type === 'reminder') {
      info = await sendReminderEmail(to, data);
    } else {
      const err = new Error('Invalid type. Use "task_completion" or "reminder".');
      err.statusCode = 400;
      return next(err);
    }

    res.json({ success: true, message: `${type} email sent.`, messageId: info.messageId });
  } catch (err) {
    next(err);
  }
};

module.exports = { notifyTaskCompletion, notifyReminder, sendCustomEmail };
