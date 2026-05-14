require('dotenv').config();
const { sendTaskCompletionEmail, sendReminderEmail } = require('./src/services/emailService');

async function runTest() {
  try {
    console.log('⏳ Sending test reminder email...');
    const reminderInfo = await sendReminderEmail('plantiqx@gmail.com', {
      reminderTitle: 'Test Reminder',
      message: 'This is a test email from the AI Office Portal to verify Nodemailer is working.',
      taskTitle: 'Test Email Setup',
      dueDate: new Date().toISOString()
    });
    console.log('✅ Reminder email sent successfully! Message ID:', reminderInfo.messageId);

    console.log('\n⏳ Sending test task completion email...');
    const taskInfo = await sendTaskCompletionEmail('plantiqx@gmail.com', {
      taskTitle: 'Test Email Setup',
      assigneeName: 'AI Assistant',
      completedAt: new Date().toLocaleString(),
      notes: 'All email services are configured and working correctly.'
    });
    console.log('✅ Task completion email sent successfully! Message ID:', taskInfo.messageId);

  } catch (error) {
    console.error('❌ Error sending email. Check your SMTP_USER and SMTP_PASS in .env');
    console.error(error.message);
  }
}

runTest();
