require('dotenv').config();
const { query } = require('../index');

async function run() {
  try {
    // Check if company_id column exists
    const check = await query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'company_id'
    `);

    if (check.rows.length === 0) {
      console.log('company_id column does not exist — nothing to do.');
      process.exit(0);
    }

    console.log('Found company_id column:', check.rows[0]);
    console.log('Dropping company_id column from tasks table...');

    await query('ALTER TABLE tasks DROP COLUMN IF EXISTS company_id');

    console.log('✅ company_id column dropped successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
