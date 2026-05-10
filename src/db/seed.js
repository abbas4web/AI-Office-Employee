/**
 * Database Seeding Script (with hashed passwords)
 * Run: node src/db/seed.js
 * Default password for all seeded users: password123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const runSeeder = async () => {
  const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    // Hash default password for all seed users
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('Hashed default password for seed users.');

    // --- Users ---
    const userInserts = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
        ('John Doe',    'john@company.com', $1, 'admin'),
        ('Jane Smith',  'jane@company.com', $1, 'manager'),
        ('Bob Wilson',  'bob@company.com',  $1, 'employee')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      [passwordHash]
    );
    console.log(`Inserted/updated ${userInserts.rowCount} users.`);

    // --- Clients ---
    await client.query(
      `INSERT INTO clients (name, email, phone, company, notes) VALUES
        ('Acme Corp',       'contact@acme.com',         '+1-555-0101', 'Acme Corporation',    'Key enterprise client'),
        ('TechStart Inc',   'hello@techstart.io',        '+1-555-0102', 'TechStart',           'Startup client, fast-paced'),
        ('Global Solutions','info@globalsolutions.com',  '+1-555-0103', 'Global Solutions Ltd','International client')
       ON CONFLICT DO NOTHING`
    );
    console.log('Inserted clients.');

    // --- Tasks ---
    await client.query(
      `INSERT INTO tasks (title, description, priority, status, due_date, assigned_to, client_id)
       VALUES
        ('Q1 Report Preparation', 'Prepare quarterly financial report for Acme Corp',
          'high', 'in_progress', NOW() + INTERVAL '3 days',
          (SELECT id FROM users WHERE email = 'john@company.com'),
          (SELECT id FROM clients WHERE company = 'Acme Corporation' LIMIT 1)),

        ('Website Migration', 'Migrate TechStart website to new hosting',
          'urgent', 'pending', NOW() + INTERVAL '1 day',
          (SELECT id FROM users WHERE email = 'jane@company.com'),
          (SELECT id FROM clients WHERE company = 'TechStart' LIMIT 1)),

        ('Contract Review', 'Review and update service contracts',
          'medium', 'pending', NOW() + INTERVAL '7 days',
          (SELECT id FROM users WHERE email = 'bob@company.com'),
          (SELECT id FROM clients WHERE company = 'Global Solutions Ltd' LIMIT 1)),

        ('Team Meeting', 'Weekly team sync meeting',
          'low', 'completed', NOW() - INTERVAL '1 day',
          (SELECT id FROM users WHERE email = 'john@company.com'), NULL)
       ON CONFLICT DO NOTHING`
    );
    console.log('Inserted tasks.');

    // --- Reminders ---
    await client.query(
      `INSERT INTO reminders (user_id, task_id, title, message, reminder_time) VALUES
        ((SELECT id FROM users WHERE email = 'john@company.com'),
         (SELECT id FROM tasks WHERE title = 'Q1 Report Preparation' LIMIT 1),
         'Report Due Soon', 'Q1 report is due in 3 days', NOW() + INTERVAL '1 day'),

        ((SELECT id FROM users WHERE email = 'jane@company.com'),
         (SELECT id FROM tasks WHERE title = 'Website Migration' LIMIT 1),
         'Urgent Task', 'Website migration deadline approaching', NOW() + INTERVAL '2 hours')
       ON CONFLICT DO NOTHING`
    );
    console.log('Inserted reminders.');

    // --- Activity Logs (Seed some fake logs so the page isn't empty) ---
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at) VALUES
        ((SELECT id FROM users WHERE email = 'john@company.com'), 'CREATE', 'task', (SELECT id FROM tasks WHERE title = 'Q1 Report Preparation' LIMIT 1), '{"title": "Q1 Report Preparation"}', NOW() - INTERVAL '2 days'),
        ((SELECT id FROM users WHERE email = 'jane@company.com'), 'CREATE', 'client', (SELECT id FROM clients WHERE company = 'TechStart' LIMIT 1), '{"name": "TechStart Inc"}', NOW() - INTERVAL '1 day'),
        ((SELECT id FROM users WHERE email = 'bob@company.com'), 'UPDATE', 'task', (SELECT id FROM tasks WHERE title = 'Contract Review' LIMIT 1), '{"status": "in_progress", "title": "Contract Review"}', NOW() - INTERVAL '5 hours'),
        ((SELECT id FROM users WHERE email = 'john@company.com'), 'COMPLETE', 'task', (SELECT id FROM tasks WHERE title = 'Team Meeting' LIMIT 1), '{"status": "completed", "title": "Team Meeting"}', NOW() - INTERVAL '1 hour')
       ON CONFLICT DO NOTHING`
    );
    console.log('Inserted sample activity logs.');

    console.log('\n✅ Seed completed!');
    console.log('   Login with: john@company.com / password123');
    console.log('               jane@company.com / password123');
    console.log('               bob@company.com  / password123');

    client.release();
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runSeeder();
