const { unauthorized } = require('../errors');
const { verifyToken } = require('../security/jwt');
const config = require('../config');
const store = require('../store');

async function authenticate(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw unauthorized('Authentication required');
  }

  const payload = verifyToken(match[1], config.jwtSecret);
  const user = store.findUserById(payload.sub);

  if (!user || user.status !== 'active') {
    throw unauthorized('Invalid token');
  }

  req.auth = payload;
  req.user = store.publicUser(user);
}

module.exports = {
  authenticate,
};
