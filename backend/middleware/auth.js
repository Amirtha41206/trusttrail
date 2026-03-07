// ============================================================
//  trusttrail — Auth Middleware
//  Checks if the request has a valid userId header.
//  In a real app this would verify a JWT token.
//  For hackathon: we just check the x-user-id header.
// ============================================================

const { users } = require('../config/db');

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Please provide x-user-id header. You must be logged in.'
    });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found. Please log in again.'
    });
  }

  // Attach user to request so controllers can use it
  req.user = user;
  next();
}

module.exports = authMiddleware;
