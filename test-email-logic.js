require('dotenv').config();
const { sendAITaskCompletionEmails } = require('./src/services/emailService');

async function test() {
  try {
    console.log('Testing sendAITaskCompletionEmails with only employee email...');
    await sendAITaskCompletionEmails(
      null, // No client email
      'plantiqx@gmail.com', // Employee email
      {
        client_email_body: 'This should not send to client.',
        employee_email_body: 'This should send to employee.'
      }
    );
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
