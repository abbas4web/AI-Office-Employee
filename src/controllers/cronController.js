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
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Mark tasks due today as urgent
      const markUrgentResult = await client.query(
        `UPDATE tasks 
         SET priority = 'urgent' 
         WHERE due_date >= $1 
         AND due_date < $2 
         AND priority != 'urgent'
         RETURNING id, title`,
        [today, new Date(today.getTime() + 24 * 60 * 60 * 1000)]
      );

      console.log(`Marked ${markUrgentResult.rowCount} tasks as urgent`);

      // 2. Find overdue tasks (due_date < today and status != completed/cancelled)
      const overdueResult = await client.query(
        `SELECT t.id, t.title, t.due_date, t.assigned_to
         FROM tasks t
         WHERE t.due_date < $1
         AND t.status NOT IN ('completed', 'cancelled')
         AND NOT EXISTS (
           SELECT 1 FROM reminders r 
           WHERE r.task_id = t.id 
           AND r.reminder_time = $2
         )`,
        [today, today]
      );

      // 3. Create reminders for overdue tasks
      let remindersCreated = 0;
      for (const task of overdueResult.rows) {
        if (task.assigned_to) {
          await client.query(
            `INSERT INTO reminders (user_id, task_id, title, message, reminder_time)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              task.assigned_to,
              task.id,
              'Task Overdue',
              `Task "${task.title}" is overdue. Due date: ${new Date(task.due_date).toLocaleDateString()}`,
              today
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
    next(err);
  }
};

module.exports = { processReminders };
