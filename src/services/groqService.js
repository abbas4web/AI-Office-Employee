const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Send a prompt WITH pre-fetched data context to Groq.
 * @param {string} context - Stringified DB data to inject into system prompt
 * @param {string} prompt  - The user's question
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

module.exports = { sendPromptWithContext };
