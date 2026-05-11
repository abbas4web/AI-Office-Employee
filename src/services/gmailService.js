const { google } = require('googleapis');
const db = require('../db');

/**
 * Create a configured OAuth2 client.
 */
const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate the Google OAuth login URL.
 * We pass userId as `state` so we can identify the user in the callback.
 */
const getAuthURL = (userId) => {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force refresh_token to be returned every time
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: userId, // passed back by Google in the callback
  });
};

/**
 * Exchange an auth code for tokens and save them to the DB.
 * @param {string} code   - The authorization code from Google
 * @param {string} userId - The user's UUID (from the state param)
 */
const exchangeCodeAndSave = async (code, userId) => {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  // Get the Gmail address that was authorized
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const gmailEmail = userInfo.data.email;

  // Save/update tokens in DB
  await db.query(
    `INSERT INTO gmail_tokens (user_id, access_token, refresh_token, token_expiry, gmail_email)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       access_token  = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, gmail_tokens.refresh_token),
       token_expiry  = EXCLUDED.token_expiry,
       gmail_email   = EXCLUDED.gmail_email,
       updated_at    = NOW()`,
    [
      userId,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      gmailEmail,
    ]
  );

  return { gmailEmail, tokens };
};

/**
 * Load saved tokens for a user and return an authenticated Gmail client.
 * Automatically refreshes the access token if expired.
 */
const getGmailClient = async (userId) => {
  const result = await db.query(
    `SELECT access_token, refresh_token, token_expiry FROM gmail_tokens WHERE user_id = $1`,
    [userId]
  );

  if (!result.rows.length) {
    const err = new Error('Gmail not connected. Please connect your Gmail account first.');
    err.statusCode = 403;
    throw err;
  }

  const row = result.rows[0];
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.token_expiry ? new Date(row.token_expiry).getTime() : null,
  });

  // Auto-refresh if expired
  oauth2Client.on('tokens', async (newTokens) => {
    await db.query(
      `UPDATE gmail_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [newTokens.access_token, new Date(newTokens.expiry_date), userId]
    );
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Read emails from the user's Gmail inbox.
 * @param {string} userId     - User UUID
 * @param {number} maxResults - Number of emails to fetch (default 15)
 * @param {string} query      - Gmail search query (default: unread inbox)
 */
const readEmails = async (userId, maxResults = 15, query = 'is:unread in:inbox') => {
  const gmail = await getGmailClient(userId);

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  const messages = listRes.data.messages || [];
  if (!messages.length) return [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload.headers;
      const get = (name) => headers.find((h) => h.name === name)?.value || '';

      // Parse sender name from "Name <email@example.com>"
      const fromRaw = get('From');
      const senderName = fromRaw.match(/^([^<]+)/)?.[1]?.trim() || fromRaw;
      const senderEmail = fromRaw.match(/<(.+)>/)?.[1] || fromRaw;

      return {
        id: msg.id,
        from: fromRaw,
        sender_name: senderName,
        sender_email: senderEmail,
        subject: get('Subject') || '(No Subject)',
        date: get('Date'),
        snippet: detail.data.snippet || '',
      };
    })
  );

  return emails;
};

/**
 * Check if a user has Gmail connected.
 */
const getConnectionStatus = async (userId) => {
  const result = await db.query(
    `SELECT gmail_email, updated_at FROM gmail_tokens WHERE user_id = $1`,
    [userId]
  );
  if (!result.rows.length) return { connected: false };
  return { connected: true, gmail_email: result.rows[0].gmail_email, updated_at: result.rows[0].updated_at };
};

/**
 * Disconnect Gmail for a user (delete their tokens).
 */
const disconnectGmail = async (userId) => {
  await db.query(`DELETE FROM gmail_tokens WHERE user_id = $1`, [userId]);
};

module.exports = { getAuthURL, exchangeCodeAndSave, readEmails, getConnectionStatus, disconnectGmail };
