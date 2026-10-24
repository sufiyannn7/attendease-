const crypto = require('crypto');
// Device fingerprint shared by seed and check-in controller (sha256 of
// user-agent + accept-language, truncated — best-effort proxy).
function deviceHash(ua, lang) {
  return crypto.createHash('sha256').update(`${ua}::${lang}`).digest('hex').slice(0, 24);
}
module.exports = { deviceHash };
