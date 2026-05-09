# Node.js Express Backend with PostgreSQL

A clean, beginner-friendly, production-ready Node.js backend using Express and PostgreSQL.

## Folder Structure

```
src/
├── controllers/     # Handle HTTP requests & responses
├── routes/          # Define API routes
├── services/        # Business logic & database operations
├── db/              # Database connection & queries
├── middleware/      # Express middleware (error handling, auth, etc.)
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

3. **Create database schema** (run in PostgreSQL)

   ```bash
   # Run schema creation
   psql $DATABASE_URL -f src/db/schema.sql

   # Optional: Add sample data
   psql $DATABASE_URL -f src/db/seed.sql
   ```

4. **Start the server**

   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

| Method | Endpoint       | Description       |
| ------ | -------------- | ----------------- |
| GET    | /              | Health check      |
| GET    | /api/users     | Get all users     |
| GET    | /api/users/:id | Get user by ID    |
| POST   | /api/users     | Create a new user |

## Features

- **Clean Architecture**: Separation of concerns with controllers, services, and routes
- **PostgreSQL Connection Pool**: Efficient database connections using `pg`
- **Environment Variables**: Secure config using `dotenv`
- **CORS Enabled**: Cross-origin requests supported
- **JSON Parsing**: Built-in Express JSON middleware
- **Error Handling**: Centralized error handler middleware
- **Production Ready**: Environment-aware logging and error responses

## Database Schema

| Table           | Description            | Key Fields                                     |
| --------------- | ---------------------- | ---------------------------------------------- |
| `users`         | System users/employees | id, name, email, role                          |
| `clients`       | External customers     | id, name, email, company                       |
| `tasks`         | Work assignments       | title, description, priority, status, due_date |
| `reminders`     | User notifications     | title, message, reminder_time, is_read         |
| `activity_logs` | System audit trail     | action, entity_type, details (JSONB)           |

### Relationships

- `tasks.assigned_to` → `users.id`
- `tasks.client_id` → `clients.id`
- `reminders.user_id` → `users.id`
- `reminders.task_id` → `tasks.id`
- `activity_logs.user_id` → `users.id`

## Environment Variables

| Variable     | Description               | Default     |
| ------------ | ------------------------- | ----------- |
| PORT         | Server port               | 3000        |
| NODE_ENV     | Environment mode          | development |
| DATABASE_URL | PostgreSQL connection URL | -           |
| DB_HOST      | PostgreSQL host           | localhost   |
| DB_PORT      | PostgreSQL port           | 5432        |
| DB_NAME      | Database name             | mydb        |
| DB_USER      | Database user             | postgres    |
| DB_PASSWORD  | Database password         | -           |

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Add Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add `DATABASE_URL` with your Neon PostgreSQL connection string
   - Add `NODE_ENV=production`

### Important Notes

- **Database**: Ensure your Neon PostgreSQL allows connections from Vercel's IP ranges (or use `sslmode=require`)
- **Serverless**: The app runs as serverless functions on Vercel
- **CORS**: Already enabled for all origins in `app.js`
