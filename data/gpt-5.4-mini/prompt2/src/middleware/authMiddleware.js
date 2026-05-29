const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'change-me');
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
