const { sendPromptWithContext, getTaskSummaryJSON, getProductivitySuggestions, runOfficeWorkflow } = require('../services/groqService');
const { sendReminderEmail } = require('../services/emailService');
const db = require('../db');

/**
 * POST /api/ai/ask
 * Fetches ALL portal data from DB and injects it as context,
 * including the currently logged-in user from the JWT.
 */
const askAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const currentUser = req.user; // from JWT middleware

    if (!prompt || !prompt.trim()) {
      const err = new Error('Prompt is required');
      err.statusCode = 400;
      return next(err);
    }

    // --- Fetch all portal data in parallel ---
    const [tasksResult, clientsResult, usersResult, remindersResult, activityResult, statsResult] = await Promise.all([
      // Tasks with assignee and client names
      db.query(
        `SELECT t.title, t.description, t.priority, t.status, t.due_date,
                u.name AS assigned_to, c.name AS client_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN clients c ON t.client_id = c.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 50`,
        []
      ),
      // All clients
      db.query(
        `SELECT name, company, email, phone, notes FROM clients ORDER BY name LIMIT 20`,
        []
      ),
      // All users/employees
      db.query(
        `SELECT name, email, role FROM users ORDER BY name`,
        []
      ),
      // Upcoming/unread reminders
      db.query(
        `SELECT r.title, r.message, r.is_read, t.title AS task_title
         FROM reminders r
         LEFT JOIN tasks t ON r.task_id = t.id
         ORDER BY r.created_at DESC LIMIT 10`,
        []
      ),
      // Recent activity
      db.query(
        `SELECT al.action, al.entity_type, al.details, al.created_at, u.name AS performed_by
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC LIMIT 10`,
        []
      ),
      // Overall task stats
      db.query(
        `SELECT 
           COUNT(*) as total_tasks,
           SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tasks,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
           SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
         FROM tasks`,
        []
      )
    ]);

    // --- Build full context string ---
    let context = '=== PORTAL DATA ===\n\n';

    // Overall Stats
    const stats = statsResult.rows[0];
    context += `OVERALL SYSTEM STATS:\n`;
    context += `  Total Tasks: ${stats.total_tasks}\n`;
    context += `  Urgent Tasks: ${stats.urgent_tasks || 0}\n`;
    context += `  Pending Tasks: ${stats.pending_tasks || 0}\n`;
    context += `  In Progress Tasks: ${stats.in_progress_tasks || 0}\n`;
    context += `  Completed Tasks: ${stats.completed_tasks || 0}\n\n`;

    // Current logged-in user
    context += `CURRENTLY LOGGED IN USER:\n`;
    context += `  Name: ${currentUser.name}\n`;
    context += `  Email: ${currentUser.email}\n`;
    context += `  Role: ${currentUser.role}\n\n`;

    // Tasks
    const tasks = tasksResult.rows;
    context += `TASKS (${tasks.length} total):\n`;
    if (tasks.length > 0) {
      tasks.forEach((t, i) => {
        context += `  ${i + 1}. [${(t.priority || 'medium').toUpperCase()}] "${t.title}"`;
        context += ` | Status: ${t.status}`;
        if (t.assigned_to)  context += ` | Assigned to: ${t.assigned_to}`;
        if (t.client_name)  context += ` | Client: ${t.client_name}`;
        if (t.due_date) {
          const d = new Date(t.due_date);
          const formatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
          context += ` | Due: ${formatted}`;
        }
        context += '\n';
      });
    } else {
      context += '  No tasks found.\n';
    }

    // Clients
    const clients = clientsResult.rows;
    context += `\nCLIENTS (${clients.length} total):\n`;
    if (clients.length > 0) {
      clients.forEach((c, i) => {
        context += `  ${i + 1}. ${c.name}`;
        if (c.company) context += ` (${c.company})`;
        if (c.email)   context += ` — ${c.email}`;
        if (c.phone)   context += ` | ${c.phone}`;
        context += '\n';
      });
    } else {
      context += '  No clients found.\n';
    }

    // Users/Employees
    const users = usersResult.rows;
    context += `\nEMPLOYEES / USERS (${users.length} total):\n`;
    users.forEach((u, i) => {
      context += `  ${i + 1}. ${u.name} — ${u.email} (${u.role})\n`;
    });

    // Reminders
    const reminders = remindersResult.rows;
    context += `\nREMINDERS (${reminders.length} recent):\n`;
    if (reminders.length > 0) {
      reminders.forEach((r, i) => {
        context += `  ${i + 1}. "${r.title}" — ${r.message}`;
        if (r.task_title) context += ` (Task: ${r.task_title})`;
        context += ` | Read: ${r.is_read ? 'Yes' : 'No'}\n`;
      });
    } else {
      context += '  No reminders found.\n';
    }

    // Recent Activity
    const activity = activityResult.rows;
    context += `\nRECENT ACTIVITY (last ${activity.length} events):\n`;
    if (activity.length > 0) {
      activity.forEach((a, i) => {
        const when = new Date(a.created_at).toLocaleString('en-IN');
        const detail = a.details?.title || a.details?.name || '';
        context += `  ${i + 1}. ${a.performed_by || 'System'} ${a.action} ${a.entity_type}`;
        if (detail) context += ` "${detail}"`;
        context += ` at ${when}\n`;
      });
    } else {
      context += '  No recent activity.\n';
    }

    context += '\n=== END OF PORTAL DATA ===\n';

    const aiMessage = await sendPromptWithContext(context, prompt.trim());

    // Check if the AI decided to call a tool
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      let replyMessage = '';
      const emailPromises = [];

      for (const toolCall of aiMessage.tool_calls) {
        if (toolCall.function.name === 'send_email_reminder') {
          const args = JSON.parse(toolCall.function.arguments);
          
          const emailPromise = sendReminderEmail(args.to_email, {
            reminderTitle: 'Task Reminder from AI Assistant',
            message: args.message,
            taskTitle: args.task_title,
            dueDate: args.due_date || 'N/A'
          })
          .then(() => {
            replyMessage += `✅ Sent reminder to **${args.to_email}** regarding "**${args.task_title}**".\n\n`;
          })
          .catch((error) => {
            console.error("Failed to send AI email:", error);
            replyMessage += `⚠️ Failed to send to **${args.to_email}** (Server Error).\n\n`;
          });

          emailPromises.push(emailPromise);
        }
      }

      // Wait for all queued emails to finish
      if (emailPromises.length > 0) {
        await Promise.all(emailPromises);
        return res.json({ success: true, reply: replyMessage.trim() });
      }
    }

    // Normal text response — if content is null (model called an unhandled tool),
    // fall back to a direct plain-text call without tools
    const replyText = aiMessage.content;
    if (!replyText) {
      const { sendPlainPromptWithContext } = require('../services/groqService');
      const plainReply = await sendPlainPromptWithContext(context, prompt.trim());
      return res.json({ success: true, reply: plainReply });
    }

    res.json({ success: true, reply: replyText });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/task-summary
 * Fetches all tasks from DB, identifies urgent/overdue work,
 * and asks Groq to return a structured JSON daily summary.
 */
const taskSummary = async (req, res, next) => {
  try {
    const now = new Date();

    // Fetch all tasks with assignee info
    const result = await db.query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
              u.name AS assigned_to, c.name AS client_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN clients c ON t.client_id = c.id
       ORDER BY t.due_date ASC NULLS LAST`,
      []
    );

    const tasks = result.rows;

    // Pre-classify tasks (gives Groq cleaner input)
    const urgentTasks   = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const overdueTasks  = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
    const pendingTasks  = tasks.filter(t => t.status === 'pending');
    const inProgress    = tasks.filter(t => t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Build compact task list for the prompt
    const formatTask = (t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null,
      assigned_to: t.assigned_to || null,
      client: t.client_name || null,
      is_overdue: t.due_date ? new Date(t.due_date) < now : false,
    });

    const taskPayload = {
      today: now.toISOString().split('T')[0],
      stats: {
        total: tasks.length,
        urgent: urgentTasks.length,
        overdue: overdueTasks.length,
        pending: pendingTasks.length,
        in_progress: inProgress.length,
        completed: completedTasks.length,
      },
      all_tasks: tasks.map(formatTask),
    };

    const summaryJSON = await getTaskSummaryJSON(taskPayload);
    res.json({ success: true, data: summaryJSON });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/productivity
 * Analyzes tasks + team workload and returns short, professional suggestions:
 * top priority, risks, workload issues, quick wins, productivity score.
 */
const productivitySuggestions = async (req, res, next) => {
  try {
    const now = new Date();

    // Fetch tasks + team size in parallel
    const [tasksResult, usersResult] = await Promise.all([
      db.query(
        `SELECT t.title, t.priority, t.status, t.due_date,
                u.name AS assigned_to
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 30`,
        []
      ),
      db.query(`SELECT COUNT(*) AS total FROM users`, []),
    ]);

    const tasks = tasksResult.rows.map(t => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      assigned_to: t.assigned_to || 'Unassigned',
      due_date: t.due_date ? t.due_date.toISOString().split('T')[0] : null,
      is_overdue: t.due_date && new Date(t.due_date) < now && t.status !== 'completed',
    }));

    const payload = {
      today: now.toISOString().split('T')[0],
      team_size: parseInt(usersResult.rows[0].total),
      task_count: tasks.length,
      urgent_count: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      overdue_count: tasks.filter(t => t.is_overdue).length,
      pending_count: tasks.filter(t => t.status === 'pending').length,
      in_progress_count: tasks.filter(t => t.status === 'in_progress').length,
      completed_count: tasks.filter(t => t.status === 'completed').length,
      tasks,
    };

    const result = await getProductivitySuggestions(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/workflow
 * The full AI Office Employee workflow.
 * Fetches tasks, reminders, and emails as input sources,
 * and returns a comprehensive structured JSON daily briefing.
 */
const runWorkflow = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    // Fetch all data sources in parallel
    const [tasksResult, remindersResult, emailsResult] = await Promise.all([
      db.query(
        `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
                u.name AS assigned_to, c.name AS client_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN clients c ON t.client_id = c.id
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 50`,
        []
      ),
      db.query(
        `SELECT r.id, r.title, r.message, r.is_read, r.created_at,
                t.title AS task_title, t.due_date AS task_due_date
         FROM reminders r
         LEFT JOIN tasks t ON r.task_id = t.id
         ORDER BY r.created_at DESC LIMIT 20`,
        []
      ),
      db.query(
        `SELECT subject, sender_name, sender_email, snippet, date
         FROM gmail_emails
         ORDER BY date DESC LIMIT 15`,
        []
      ).catch(() => ({ rows: [] })), // Gmail table may not exist — fail gracefully
    ]);

    const tasks = tasksResult.rows;
    const reminders = remindersResult.rows;
    const emails = emailsResult.rows;

    // Pre-classify tasks
    const urgentTasks  = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
    const unreadReminders = reminders.filter(r => !r.is_read);

    const formatDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    // Build compact payload for AI
    const payload = {
      today: todayStr,
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description || null,
        priority: t.priority,
        status: t.status,
        assigned_to: t.assigned_to || null,
        client: t.client_name || null,
        due_date: formatDate(t.due_date),
        is_overdue: t.due_date ? new Date(t.due_date) < now && t.status !== 'completed' : false,
      })),
      reminders: reminders.map(r => ({
        title: r.title,
        message: r.message,
        is_read: r.is_read,
        related_task: r.task_title || null,
        task_due_date: formatDate(r.task_due_date),
      })),
      emails: emails.map(e => ({
        subject: e.subject,
        from: `${e.sender_name} <${e.sender_email}>`,
        preview: e.snippet,
        date: formatDate(e.date),
      })),
      stats: {
        total_tasks: tasks.length,
        urgent_tasks: urgentTasks.length,
        overdue_tasks: overdueTasks.length,
        pending_tasks: tasks.filter(t => t.status === 'pending').length,
        in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        unread_reminders: unreadReminders.length,
        total_emails_analyzed: emails.length,
      },
    };

    const result = await runOfficeWorkflow(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { askAI, taskSummary, productivitySuggestions, runWorkflow };
