const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required but was not provided in environment variables.');
}

module.exports = function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid token' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email, name: payload.name };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
