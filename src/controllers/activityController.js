const db = require('../db');

/**
 * GET /api/activity-logs
 * Returns paginated activity logs with user info and optional filters.
 * Query params: entity_type, action, limit, offset
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { entity_type, action, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.created_at,
        u.name  AS performed_by,
        u.email AS performed_by_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      sql += ` AND al.entity_type = $${paramIndex++}`;
      params.push(entity_type);
    }

    if (action) {
      sql += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(Number(limit), Number(offset));

    const result = await db.query(sql, params);

    // Also get total count for pagination
    let countSql = `SELECT COUNT(*) FROM activity_logs WHERE 1=1`;
    const countParams = [];
    let cpi = 1;
    if (entity_type) { countSql += ` AND entity_type = $${cpi++}`; countParams.push(entity_type); }
    if (action)      { countSql += ` AND action = $${cpi++}`;      countParams.push(action); }

    const countResult = await db.query(countSql, countParams);

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      limit: Number(limit),
      offset: Number(offset),
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLogs };
