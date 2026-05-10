const jwt = require('jsonwebtoken');

/**
 * Middleware: protect
 * Verifies the JWT from the Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('No token provided. Access denied.');
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token. Please log in again.');
    error.statusCode = 401;
    return next(error);
  }
};

module.exports = { protect };
