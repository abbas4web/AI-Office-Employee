const db = require('../db');

/**
 * Cron Job: Process task reminders
 * - Mark tasks due today as urgent
 * - Create reminders for overdue tasks
 */
const processReminders = async (req, res, next) => {
  try {
    const client = await db.pool.connect();

    try {
      // Get today's date as ISO string (YYYY-MM-DD)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 1. Mark tasks due today as urgent
      const markUrgentResult = await client.query(
        `UPDATE tasks 
         SET priority = 'urgent' 
         WHERE due_date >= $1 
         AND due_date < $2 
         AND priority != 'urgent'
         RETURNING id, title`,
        [todayStr, tomorrowStr]
      );

      console.log(`Marked ${markUrgentResult.rowCount} tasks as urgent`);

      // 2. Find overdue tasks (due_date < today and status != completed/cancelled)
      const overdueResult = await client.query(
        `SELECT t.id, t.title, t.due_date::text, t.assigned_to
         FROM tasks t
         WHERE t.due_date < $1
         AND t.status NOT IN ('completed', 'cancelled')
         AND NOT EXISTS (
           SELECT 1 FROM reminders r 
           WHERE r.task_id = t.id 
           AND r.reminder_time >= $2
           AND r.reminder_time < $3
         )`,
        [todayStr, todayStr, tomorrowStr]
      );

      // 3. Create reminders for overdue tasks
      let remindersCreated = 0;
      for (const task of overdueResult.rows) {
        if (task.assigned_to) {
          await client.query(
            `INSERT INTO reminders (user_id, task_id, title, message, reminder_time)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              task.assigned_to,
              task.id,
              'Task Overdue',
              `Task "${task.title}" is overdue. Due date: ${task.due_date}`
            ]
          );
          remindersCreated++;
        }
      }

      console.log(`Created ${remindersCreated} reminders for overdue tasks`);

      res.json({
        success: true,
        message: 'Cron job completed',
        data: {
          markedUrgent: markUrgentResult.rowCount,
          remindersCreated
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Cron job error:', err);
    res.status(500).json({
      success: false,
      message: 'Cron job failed',
      error: err.message
    });
  }
};

module.exports = { processReminders };
