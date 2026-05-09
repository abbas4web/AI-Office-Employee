require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./db');

const PORT = process.env.PORT || 3000;

// Test DB connection on startup
testConnection();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
