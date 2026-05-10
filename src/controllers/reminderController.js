const db = require('../db');

/**
 * GET /reminders
 * Returns all reminders for a user.
 */
const getReminders = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    
    let sql = `
      SELECT r.*, t.title as task_title
      FROM reminders r
      LEFT JOIN tasks t ON r.task_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (user_id) {
      sql += ' AND r.user_id = $1';
      params.push(user_id);
    }
    
    sql += ' ORDER BY r.created_at DESC';
    
    const result = await db.query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /reminders/:id
 * Mark reminder as read.
 */
const markAsRead = async (req, res, next) => {
  try {
    const result = await db.query(
      'UPDATE reminders SET is_read = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Reminder not found');
      error.statusCode = 404;
      return next(error);
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReminders, markAsRead };
