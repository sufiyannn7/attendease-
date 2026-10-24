const env = require('../config/env');

function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route ${req.method} ${req.originalUrl} not found`), { status: 404 }));
}

// Central error middleware — every failure leaves the API as
// { error: { message, details? } } with a correct status code.
function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const body = { error: { message: err.status || err.statusCode ? err.message : 'Something went wrong on our side' } };
  if (err.details) body.error.details = err.details;
  if (env.NODE_ENV !== 'production' && status === 500) console.error(err);
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
