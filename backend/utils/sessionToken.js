const crypto = require('crypto');

// Rotating attendance tokens: HMAC(secret, sessionId:minuteBucket).
// The teacher's screen re-renders the QR every 15s, but the underlying token
// changes each minute; current + previous bucket accepted (clock drift).
const BUCKET_MS = 60 * 1000;

const sessionSecret = (sessionId) =>
  crypto.createHash('sha256').update(`${process.env.JWT_SECRET || 'dev-secret'}:attendease:${sessionId}`).digest('hex');

function hmacFor(sessionId, bucket) {
  return crypto.createHmac('sha256', sessionSecret(sessionId)).update(`${sessionId}:${bucket}`).digest('hex').slice(0, 12).toUpperCase();
}

function makeToken(sessionId, now = Date.now()) {
  return hmacFor(sessionId, Math.floor(now / BUCKET_MS));
}

function verifyToken(token, sessionId, now = Date.now()) {
  const current = hmacFor(sessionId, Math.floor(now / BUCKET_MS));
  if (String(token).toUpperCase() === current) return 'ok';
  const previous = hmacFor(sessionId, Math.floor(now / BUCKET_MS) - 1);
  if (String(token).toUpperCase() === previous) return 'stale';
  return 'invalid';
}

// Best-effort device fingerprint from request headers (documented proxy,
// not a security boundary by itself — paired with one-record-per-student).
function deviceHash(req) {
  const ua = req.headers['user-agent'] || 'unknown';
  const lang = req.headers['accept-language'] || 'unknown';
  return crypto.createHash('sha256').update(`${ua}::${lang}`).digest('hex').slice(0, 24);
}

module.exports = { makeToken, verifyToken, deviceHash, BUCKET_MS };
