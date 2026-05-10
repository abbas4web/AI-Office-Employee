-- Seed data for AI Office Employee application
-- Run this after creating the schema to populate sample data
-- NOTE: password_hash below is bcrypt hash of 'password123'
-- Prefer using: node src/db/seed.js (which generates the hash at runtime)

-- Insert sample users (password: password123)
INSERT INTO users (name, email, password_hash, role) VALUES
    ('John Doe',    'john@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
    ('Jane Smith',  'jane@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('Bob Wilson',  'bob@company.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee')
ON CONFLICT (email) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (name, email, phone, company, notes) VALUES
    ('Acme Corp', 'contact@acme.com', '+1-555-0101', 'Acme Corporation', 'Key enterprise client'),
    ('TechStart Inc', 'hello@techstart.io', '+1-555-0102', 'TechStart', 'Startup client, fast-paced'),
    ('Global Solutions', 'info@globalsolutions.com', '+1-555-0103', 'Global Solutions Ltd', 'International client');

-- Insert sample tasks
INSERT INTO tasks (title, description, priority, status, due_date, assigned_to, client_id) VALUES
    ('Q1 Report Preparation', 'Prepare quarterly financial report for Acme Corp', 'high', 'in_progress', NOW() + INTERVAL '3 days', (SELECT id FROM users WHERE email = 'john@company.com'), (SELECT id FROM clients WHERE company = 'Acme Corporation')),
    ('Website Migration', 'Migrate TechStart website to new hosting', 'urgent', 'pending', NOW() + INTERVAL '1 day', (SELECT id FROM users WHERE email = 'jane@company.com'), (SELECT id FROM clients WHERE company = 'TechStart')),
    ('Contract Review', 'Review and update service contracts', 'medium', 'pending', NOW() + INTERVAL '7 days', (SELECT id FROM users WHERE email = 'bob@company.com'), (SELECT id FROM clients WHERE company = 'Global Solutions Ltd')),
    ('Team Meeting', 'Weekly team sync meeting', 'low', 'completed', NOW() - INTERVAL '1 day', (SELECT id FROM users WHERE email = 'john@company.com'), NULL);

-- Insert sample reminders
INSERT INTO reminders (user_id, task_id, title, message, reminder_time) VALUES
    ((SELECT id FROM users WHERE email = 'john@company.com'), (SELECT id FROM tasks WHERE title = 'Q1 Report Preparation'), 'Report Due Soon', 'Q1 report is due in 3 days', NOW() + INTERVAL '1 day'),
    ((SELECT id FROM users WHERE email = 'jane@company.com'), (SELECT id FROM tasks WHERE title = 'Website Migration'), 'Urgent Task', 'Website migration deadline approaching', NOW() + INTERVAL '2 hours');
