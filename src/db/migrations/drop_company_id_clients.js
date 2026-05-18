require('dotenv').config();
const { query } = require('../index');

async function run() {
  try {
    // Check all NOT NULL columns that shouldn't be there on both tables
    const check = await query(`
      SELECT table_name, column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('clients', 'tasks', 'users')
        AND column_name = 'company_id'
    `);

    if (check.rows.length === 0) {
      console.log('No company_id columns found — nothing to do.');
      process.exit(0);
    }

    console.log('Found company_id columns:', check.rows);

    for (const row of check.rows) {
      console.log(`Dropping company_id from ${row.table_name}...`);
      await query(`ALTER TABLE ${row.table_name} DROP COLUMN IF EXISTS company_id`);
      console.log(`✅ Dropped from ${row.table_name}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
