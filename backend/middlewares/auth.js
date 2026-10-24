const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, env.JWT_SECRET); // { id, name }
    next();
  } catch {
    next(new AppError(401, 'Session expired or invalid — please log in again'));
  }
}

module.exports = { requireAuth };
