const crypto = require('crypto');

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return crypto.createHash('sha256').update(`${process.cwd()}:rentall-local-demo`).digest('hex');
}

module.exports = { getJwtSecret };
