const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Send a prompt WITH pre-fetched data context to Groq.
 * Used by the general AI chat assistant.
 */
const sendPromptWithContext = async (context, prompt) => {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'send_email_reminder',
        description: 'Sends a task reminder email to an employee or client. Use this whenever the user asks to send an email, remind someone, or notify someone. Find their email in the provided PORTAL DATA context.',
        parameters: {
          type: 'object',
          properties: {
            to_email: { type: 'string', description: 'The email address of the recipient (e.g., john@company.com)' },
            task_title: { type: 'string', description: 'The title of the task to remind them about' },
            message: { type: 'string', description: 'A short, professional reminder message' },
            due_date: { type: 'string', description: 'The due date of the task, if available (e.g., 2026-05-15)' }
          },
          required: ['to_email', 'task_title', 'message']
        }
      }
    }
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for an office management system.
You have access to the following real-time data from the system database:

${context}

Use this data to answer the user's questions accurately. Be concise and professional.
CRITICAL: Users often make typos (e.g., typing "argent" instead of "urgent"). Intelligently infer their intent and map it to the actual data priority levels/categories.
If asked about total counts (e.g. "how many urgent tasks"), always look at the OVERALL SYSTEM STATS section first.
ONLY use the send_email_reminder tool when the user EXPLICITLY asks you to send an email or remind someone. Never use it for general questions.
If no data is relevant, answer generally but mention what data you have access to.`,
      },
      { role: 'user', content: prompt },
    ],
    tools: tools,
    tool_choice: 'auto',
  });

  return response.choices[0].message;
};

/**
 * Generate a structured JSON daily task summary using Groq.
 * Forces JSON output via response_format and explicit prompt engineering.
 *
 * @param {object} taskPayload - Pre-classified task data from the DB
 * @returns {object} Parsed JSON summary
 */
const getTaskSummaryJSON = async (taskPayload) => {
  const prompt = `You are an office management AI. Analyze the following task data and generate a structured daily summary.

TASK DATA:
${JSON.stringify(taskPayload, null, 2)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just JSON):
{
  "date": "<today's date>",
  "daily_summary": "<2-3 sentence overview of the workload today>",
  "urgent_tasks": [
    { "title": "<task title>", "assigned_to": "<name or null>", "due_date": "<date or null>", "reason": "<why it's urgent>" }
  ],
  "overdue_tasks": [
    { "title": "<task title>", "assigned_to": "<name or null>", "due_date": "<original due date>", "days_overdue": <number> }
  ],
  "in_progress_tasks": [
    { "title": "<task title>", "assigned_to": "<name or null>" }
  ],
  "stats": {
    "total": <number>,
    "urgent": <number>,
    "overdue": <number>,
    "pending": <number>,
    "in_progress": <number>,
    "completed": <number>
  },
  "recommendation": "<1-2 sentence action recommendation for the team today>",
  "priority_order": ["<task title 1>", "<task title 2>", "<task title 3>"]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.3, // Lower temperature = more deterministic JSON output
  });

  const raw = response.choices[0].message.content;

  // Parse JSON — groq with json_object mode guarantees valid JSON
  return JSON.parse(raw);
};

/**
 * Generate short, professional productivity suggestions from task + team data.
 * Returns JSON: priority, risks, workload_issues, quick_wins, summary.
 *
 * @param {object} payload - { tasks, userCount, today }
 * @returns {object} Parsed JSON suggestions
 */
const getProductivitySuggestions = async (payload) => {
  const prompt = `You are a professional office productivity advisor. Analyze this workspace data and provide concise, actionable suggestions.

WORKSPACE DATA:
${JSON.stringify(payload, null, 2)}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "top_priority": {
    "task": "<single most important task to do right now>",
    "reason": "<1 sentence why>"
  },
  "risks": [
    { "title": "<risk name>", "description": "<1 sentence description>", "severity": "high|medium|low" }
  ],
  "workload_issues": [
    { "issue": "<issue name>", "detail": "<1 sentence detail>" }
  ],
  "quick_wins": [
    "<short task or action that can be completed quickly>"
  ],
  "productivity_score": <number 0-100 representing current team productivity>,
  "summary": "<2-3 sentence professional assessment of the office's current productivity state>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  return JSON.parse(response.choices[0].message.content);
};

/**
 * Analyze an email using Groq and return structured task metadata.
 * Used before creating a task from Gmail to auto-set title, priority etc.
 *
 * @param {object} email - { sender_name, sender_email, subject, snippet }
 * @returns {object} { task_title, priority, is_urgent, category, summary }
 */
const getEmailAnalysis = async (email) => {
  const prompt = `You are an office task manager AI. Analyze this email and extract task information.

EMAIL:
From: ${email.sender_name} <${email.sender_email}>
Subject: ${email.subject}
Preview: ${email.snippet}

Return ONLY a valid JSON object (no markdown):
{
  "task_title": "<concise action-oriented task title, max 80 chars>",
  "priority": "<low|medium|high|urgent>",
  "is_urgent": <true|false>,
  "category": "<one of: client_request|bug_report|meeting|invoice|follow_up|review|general>",
  "summary": "<1 sentence describing what needs to be done>",
  "suggested_due_days": <number of days from today when this should be done, or null>
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
};

/**
 * Generate customized task completion emails for both the client and the employee.
 * 
 * @param {object} taskData - { title, description, clientName, employeeName }
 * @returns {object} { client_email_body, employee_email_body }
 */
const generateCompletionEmails = async (taskData) => {
  const prompt = `You are an AI assistant for a professional office portal. A task has just been completed.
Write two short, professional email messages based on this task data:

TASK DETAILS:
Title: ${taskData.title}
Description: ${taskData.description || 'No description provided'}
Client Name: ${taskData.clientName || 'Valued Client'}
Employee Name: ${taskData.employeeName || 'Our Team'}

Return ONLY a valid JSON object (no markdown):
{
  "client_email_body": "<Write a 2-3 sentence professional message to the client informing them their task is completed.>",
  "employee_email_body": "<Write a 2-3 sentence encouraging message to the employee congratulating them on finishing the task and telling them to wait for the next assignment.>"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  return JSON.parse(response.choices[0].message.content);
};

/**
 * Run the full AI Office Employee Workflow.
 * Processes tasks, reminders, and emails into a single structured JSON report.
 *
 * @param {object} payload - { today, tasks, reminders, emails, stats }
 * @returns {object} Structured office workflow report
 */
const runOfficeWorkflow = async (payload) => {
  const prompt = `You are an elite AI Office Employee. You have been given real-time data from an office management portal.
Your job is to analyze all the data and produce a comprehensive daily operational report.

OFFICE DATA:
${JSON.stringify(payload, null, 2)}

Return ONLY a valid JSON object (no markdown, no explanation, just JSON) with EXACTLY this structure:
{
  "date": "<today's date in DD-MM-YYYY format>",
  "daily_summary": "<2-3 sentence professional overview of today's office workload and situation>",
  "urgent_work": [
    {
      "title": "<task or reminder title>",
      "type": "<task|reminder|email>",
      "assigned_to": "<person name or null>",
      "reason": "<1 sentence why this is urgent>",
      "due_date": "<date in DD-MM-YYYY or null>"
    }
  ],
  "priority_suggestions": [
    {
      "rank": 1,
      "task": "<what should be done>",
      "reason": "<1 sentence why>",
      "estimated_effort": "<low|medium|high>"
    }
  ],
  "risks": [
    {
      "title": "<risk name>",
      "description": "<1 sentence describing the risk>",
      "severity": "<high|medium|low>",
      "source": "<task|reminder|email>"
    }
  ],
  "professional_summary": "<3-4 sentence executive-level summary a manager would read. Include key metrics, concerns, and positive notes.>",
  "stats": {
    "total_tasks": <number>,
    "urgent_tasks": <number>,
    "overdue_tasks": <number>,
    "pending_tasks": <number>,
    "in_progress_tasks": <number>,
    "completed_tasks": <number>,
    "unread_reminders": <number>,
    "total_emails_analyzed": <number>
  },
  "productivity_score": <number between 0 and 100>,
  "action_items": [
    "<short actionable item the team should do today>"
  ]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
};

/**
 * Plain text fallback — no tools, always returns a string.
 * Used when the tool-aware call returns null content.
 */
const sendPlainPromptWithContext = async (context, prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for an office management system.
You have access to the following real-time data:

${context}

Answer the user's question clearly and concisely using the data above.
CRITICAL: Users often make typos (e.g., typing "argent" instead of "urgent"). Intelligently infer their intent and map it to the actual data priority levels/categories.
If asked about total counts (e.g. "how many urgent tasks"), always look at the OVERALL SYSTEM STATS section first.`,
      },
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0].message.content;
};

module.exports = { sendPromptWithContext, sendPlainPromptWithContext, getTaskSummaryJSON, getProductivitySuggestions, getEmailAnalysis, generateCompletionEmails, runOfficeWorkflow };
