const { query } = require('../db');

/**
 * Cron Job: Process task reminders
 * - Mark tasks due today as urgent
 * - Create reminders for overdue tasks
 */
const processReminders = async (req, res) => {
  try {
    console.log('Starting cron job...');
    
    // Get today's date as ISO string (YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Processing for date: ${todayStr}`);

    // 1. Mark tasks due today as urgent
    const markUrgentResult = await query(
      `UPDATE tasks 
       SET priority = 'urgent' 
       WHERE due_date >= $1 
       AND due_date < $2 
       AND priority != 'urgent'
       RETURNING id, title`,
      [todayStr, tomorrowStr]
    );

    console.log(`Marked ${markUrgentResult.rowCount} tasks as urgent`);

    // 2. Find overdue tasks
    const overdueResult = await query(
      `SELECT t.id, t.title, t.assigned_to
       FROM tasks t
       WHERE t.due_date < $1
       AND t.status NOT IN ('completed', 'cancelled')
       AND t.assigned_to IS NOT NULL`,
      [todayStr]
    );

    console.log(`Found ${overdueResult.rowCount} overdue tasks`);

    // 3. Create reminders for overdue tasks
    let remindersCreated = 0;
    for (const task of overdueResult.rows) {
      await query(
        `INSERT INTO reminders (user_id, task_id, title, message, reminder_time)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          task.assigned_to,
          task.id,
          'Task Overdue',
          `Task "${task.title}" is overdue.`
        ]
      );
      remindersCreated++;
    }

    console.log(`Created ${remindersCreated} reminders`);

    res.json({
      success: true,
      message: 'Cron job completed',
      data: {
        markedUrgent: markUrgentResult.rowCount,
        remindersCreated
      }
    });
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
