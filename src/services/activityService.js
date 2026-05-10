const db = require('../db');

/**
 * Log an activity to the activity_logs table.
 * @param {string|null} user_id - UUID of the user performing the action
 * @param {string} action       - e.g. 'CREATE', 'UPDATE', 'DELETE'
 * @param {string} entity_type  - e.g. 'task', 'client'
 * @param {string|null} entity_id - UUID of the affected record
 * @param {object|null} details   - JSONB payload with extra context
 */
const logActivity = async (user_id, action, entity_type, entity_id, details = null) => {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id || null, action, entity_type, entity_id || null, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    // Never let logging failures crash the main request
    console.error('[ActivityLog] Failed to write log:', err.message);
  }
};

module.exports = { logActivity };
