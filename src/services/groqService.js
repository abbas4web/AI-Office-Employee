const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Send a prompt WITH pre-fetched data context to Groq.
 * Used by the general AI chat assistant.
 */
const sendPromptWithContext = async (context, prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for an office management system.
You have access to the following real-time data from the system database:

${context}

Use this data to answer the user's questions accurately. Be concise and professional.
If asked to summarize tasks, refer to the actual tasks listed above.
If no data is relevant, answer generally but mention what data you have access to.`,
      },
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0].message.content;
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

module.exports = { sendPromptWithContext, getTaskSummaryJSON, getProductivitySuggestions };
