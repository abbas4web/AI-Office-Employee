/**
 * Global error handling middleware.
 * Catches any error passed via next(err) and returns a clean JSON response.
 * Must be registered LAST in the Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  let statusCode = err.statusCode || 500;

  // Map known library errors to proper HTTP codes
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    err.message = 'Invalid or expired token. Please log in again.';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    err.message = 'A record with this value already exists.';
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    err.message = 'Referenced record does not exist.';
  }

  // PostgreSQL invalid input (e.g. bad UUID/integer)
  if (err.code === '22P02') {
    statusCode = 400;
    err.message = 'Invalid ID format provided.';
  }

  const message = err.message || 'Internal Server Error';

  // Always log server errors
  if (statusCode >= 500) {
    console.error(`[ERROR] ${statusCode} - ${req.method} ${req.originalUrl}`);
    console.error(err.stack);
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARN] ${statusCode} - ${message} | ${req.method} ${req.originalUrl}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
