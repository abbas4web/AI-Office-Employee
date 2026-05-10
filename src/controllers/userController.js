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

/**
 * PATCH /api/users/:id
 * Updates an existing user. Expects { name, email, role } (all optional).
 */
const updateUser = async (req, res, next) => {
  try {
    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    const { name, email, role } = req.body;
    const user = await userService.updateUser(req.params.id, { name, email, role });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Deletes a user by ID.
 */
const deleteUser = async (req, res, next) => {
  try {
    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      return next(error);
    }

    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
