const { badRequest, conflict, unauthorized } = require('../errors');
const { readJsonBody, created, ok } = require('../utils/http');
const { normalizeEmail } = require('../utils/strings');
const { signToken } = require('../security/jwt');
const config = require('../config');
const { verifyPassword } = require('../security/password');
const store = require('../store');

function validateCredentials(body) {
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!name) {
    throw badRequest('Name is required');
  }

  if (!email) {
    throw badRequest('Email is required');
  }

  if (password.length < 8) {
    throw badRequest('Password must be at least 8 characters long');
  }

  return { name, email, password };
}

async function register(req, res) {
  const body = await readJsonBody(req);
  const { name, email, password } = validateCredentials(body);
  const viewerRole = store.findRoleBySlug('viewer');

  if (!viewerRole) {
    throw badRequest('Viewer role is missing from the database');
  }

  if (store.findUserByEmail(email)) {
    throw conflict('Email already exists');
  }

  const user = store.createUser({
    name,
    email,
    password,
    roleId: viewerRole.id,
    status: 'active',
  });

  store.createAuditLog({
    actorUserId: user.id,
    action: 'auth.register',
    entityType: 'user',
    entityId: user.id,
    metadata: { email: user.email },
  });

  created(res, { user });
}

async function login(req, res) {
  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    throw badRequest('Email and password are required');
  }

  const user = store.findUserByEmail(email);
  if (!user || user.status !== 'active') {
    throw unauthorized('Invalid credentials');
  }

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw unauthorized('Invalid credentials');
  }

  const token = signToken(
    {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
    },
    config.jwtSecret,
    config.jwtExpiresInSeconds,
  );

  store.createAuditLog({
    actorUserId: user.id,
    action: 'auth.login',
    entityType: 'session',
    entityId: String(user.id),
    metadata: { email: user.email },
  });

  ok(res, {
    token,
    user: store.publicUser(user),
  });
}

async function me(req, res) {
  ok(res, { user: req.user });
}

module.exports = {
  register,
  login,
  me,
};
