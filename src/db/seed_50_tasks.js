require('dotenv').config();
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

    // Get a user and a client to assign tasks to
    const userRes = await client.query('SELECT id FROM users LIMIT 3');
    const clientRes = await client.query('SELECT id FROM clients LIMIT 3');
    
    const users = userRes.rows;
    const clients = clientRes.rows;

    if (users.length === 0 || clients.length === 0) {
        console.log("No users or clients found to assign tasks. Please ensure you have data in users/clients tables.");
        client.release();
        return;
    }

    console.log('Inserting 50 tasks...');
    
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const titles = [
      'Server Maintenance', 'Update Dependencies', 'Fix Navigation Bug', 
      'Client Onboarding', 'Quarterly Review', 'Database Optimization', 
      'Write API Docs', 'Setup CI/CD Pipeline', 'Design Mockups', 'User Testing'
    ];
    
    let count = 0;
    for (let i = 1; i <= 50; i++) {
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const daysOffset = Math.floor(Math.random() * 30) - 10; // -10 to +20 days
        const titleBase = titles[Math.floor(Math.random() * titles.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)].id;
        const randomClient = clients[Math.floor(Math.random() * clients.length)].id;
        
        await client.query(
          `INSERT INTO tasks (title, description, priority, status, due_date, assigned_to, client_id)
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${daysOffset} days', $5, $6)`,
          [
              `${titleBase} #${i}`, 
              `Auto-generated description for ${titleBase}. This task requires attention to detail.`,
              priority,
              status,
              randomUser,
              randomClient
          ]
        );
        count++;
    }

    console.log(`Successfully inserted ${count} tasks!`);
    client.release();
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await pool.end();
  }
};

runSeeder();
