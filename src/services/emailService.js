const nodemailer = require('nodemailer');

/**
 * Gmail SMTP transporter.
 * Requires in .env:
 *   SMTP_USER  — your Gmail address (e.g. office@gmail.com)
 *   SMTP_PASS  — Gmail App Password (NOT your regular password)
 *               Generate at: https://myaccount.google.com/apppasswords
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/* ── Email Templates ─────────────────────────── */

const taskCompletionTemplate = ({ taskTitle, assigneeName, completedAt, notes }) => ({
  subject: `✅ Task Completed: ${taskTitle}`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 28px 32px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 22px;">✅ Task Completed</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">AI Office Employee Portal</p>
      </div>

      <div style="background: white; border-radius: 10px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 16px;">${taskTitle}</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 140px;">Completed by</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${assigneeName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Completed at</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${completedAt || new Date().toLocaleString()}</td>
          </tr>
          ${notes ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Notes</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${notes}</td>
          </tr>` : ''}
        </table>

        <div style="margin-top: 20px; padding: 14px 18px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 6px;">
          <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: 600;">Task has been marked as completed successfully.</p>
        </div>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
        This is an automated notification from AI Office Employee Portal.
      </p>
    </div>
  `,
});

const formatDateDDMMYYYY = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const reminderTemplate = ({ reminderTitle, message, taskTitle, taskDescription, dueDate }) => ({
  subject: `🔔 Reminder: ${reminderTitle}`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 28px 32px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 22px;">🔔 Reminder</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">AI Office Employee Portal</p>
      </div>

      <div style="background: white; border-radius: 10px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 12px;">${reminderTitle}</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">${message}</p>

        ${taskTitle ? `
        <div style="padding: 14px 18px; background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 16px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Related Task:</strong> ${taskTitle}</p>
          ${taskDescription ? `<p style="margin: 6px 0 0; color: #92400e; font-size: 13px;"><strong>Description:</strong> ${taskDescription}</p>` : ''}
          ${dueDate && dueDate !== 'N/A' ? `<p style="margin: 6px 0 0; color: #92400e; font-size: 13px;"><strong>Due:</strong> ${formatDateDDMMYYYY(dueDate)}</p>` : ''}
        </div>` : ''}

        <p style="color: #64748b; font-size: 13px; margin: 0;">Please log in to the portal to take action on this reminder.</p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
        This is an automated notification from AI Office Employee Portal.
      </p>
    </div>
  `,
});

/* ── Public API ──────────────────────────────── */

/**
 * Send a task completion notification email.
 * @param {string} to          - recipient email
 * @param {object} taskData    - { taskTitle, assigneeName, completedAt, notes }
 */
const sendTaskCompletionEmail = async (to, taskData) => {
  const transporter = createTransporter();
  const { subject, html } = taskCompletionTemplate(taskData);

  const info = await transporter.sendMail({
    from: `"AI Office Portal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  return { messageId: info.messageId, accepted: info.accepted };
};

/**
 * Send a reminder notification email.
 * @param {string} to             - recipient email
 * @param {object} reminderData   - { reminderTitle, message, taskTitle, dueDate }
 */
const sendReminderEmail = async (to, reminderData) => {
  const transporter = createTransporter();
  const { subject, html } = reminderTemplate(reminderData);

  const info = await transporter.sendMail({
    from: `"AI Office Portal" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  return { messageId: info.messageId, accepted: info.accepted };
};

/**
 * Send AI-generated completion emails to the client and/or employee.
 * @param {string} clientEmail 
 * @param {string} employeeEmail 
 * @param {object} aiContent - { client_email_body, employee_email_body }
 */
const sendAITaskCompletionEmails = async (clientEmail, employeeEmail, aiContent) => {
  const transporter = createTransporter();
  
  const generateHTML = (title, bodyText) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">${title}</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${bodyText}</p>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">AI Office Employee Portal</p>
      </div>
    </div>
  `;

  const promises = [];

  if (clientEmail && aiContent.client_email_body) {
    promises.push(transporter.sendMail({
      from: `"AI Office Portal" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `Task Update: Your task has been completed`,
      html: generateHTML('Task Completed', aiContent.client_email_body),
    }));
  }

  if (employeeEmail && aiContent.employee_email_body) {
    promises.push(transporter.sendMail({
      from: `"AI Office Portal" <${process.env.SMTP_USER}>`,
      to: employeeEmail,
      subject: `Great Job: Task completed`,
      html: generateHTML('Task Completed successfully', aiContent.employee_email_body),
    }));
  }

  const results = await Promise.all(promises);
  return results;
};

module.exports = { sendTaskCompletionEmail, sendReminderEmail, sendAITaskCompletionEmails };
