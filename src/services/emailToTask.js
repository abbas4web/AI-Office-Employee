const db = require('../db');
const { logActivity } = require('./activityService');

/**
 * Convert a Gmail email object into a task in the database.
 *
 * @param {object} email  - { sender_name, sender_email, subject, snippet }
 * @param {string} userId - UUID of the logged-in user (task creator + assignee)
 */
const convertEmailToTask = async (email, userId) => {
  const title = email.subject || 'Email Task (No Subject)';
  const description = [
    `From: ${email.sender_name} <${email.sender_email}>`,
    '',
    'Email preview:',
    email.snippet || '(No preview available)',
  ].join('\n');

  const result = await db.query(
    `INSERT INTO tasks (title, description, priority, status, assigned_to)
     VALUES ($1, $2, 'medium', 'pending', $3)
     RETURNING *`,
    [title, description, userId]
  );

  const task = result.rows[0];

  // Log the activity
  await logActivity(userId, 'CREATE', 'task', task.id, {
    title: task.title,
    source: 'gmail',
    from_email: email.sender_email,
  });

  return task;
};

module.exports = { convertEmailToTask };
