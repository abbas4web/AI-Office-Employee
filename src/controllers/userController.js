const userService = require('../services/userService');

/**
 * GET /api/users
 * Returns a list of all users.
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Returns a single user by ID.
 */
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Creates a new user. Expects { name, email } in request body.
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      const error = new Error('Name and email are required');
      error.statusCode = 400;
      return next(error);
    }

    const user = await userService.createUser(name, email);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser };
