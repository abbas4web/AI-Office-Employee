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
  const priority = email.priority || 'medium';

  // Build description: include AI summary if available
  const description = [
    `From: ${email.sender_name} <${email.sender_email}>`,
    email.summary ? `\nAI Summary: ${email.summary}` : '',
    '',
    'Email preview:',
    email.snippet || '(No preview available)',
  ].filter(Boolean).join('\n');

  // Calculate due_date from suggested_due_days if provided
  let dueDate = null;
  if (email.due_days && Number.isInteger(email.due_days)) {
    const d = new Date();
    d.setDate(d.getDate() + email.due_days);
    dueDate = d.toISOString();
  }

  const result = await db.query(
    `INSERT INTO tasks (title, description, priority, status, assigned_to, due_date)
     VALUES ($1, $2, $3, 'pending', $4, $5)
     RETURNING *`,
    [title, description, priority, userId, dueDate]
  );

  const task = result.rows[0];

  await logActivity(userId, 'CREATE', 'task', task.id, {
    title: task.title,
    source: 'gmail',
    from_email: email.sender_email,
    ai_priority: priority,
  });

  return task;
};


module.exports = { convertEmailToTask };
