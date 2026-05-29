const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = 'sid';
const SESSION_TTL_MS = 1000 * 60 * 60;
const PUBLIC_DIR = path.join(__dirname, 'public');
const STYLE_PATH = path.join(PUBLIC_DIR, 'styles.css');

const demoUser = {
  id: 'demo-user',
  username: 'demo',
  password: 'password123',
  displayName: 'Demo User',
};

const sessions = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) {
      return cookies;
    }

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) {
    return { sessionId: null, session: null };
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return { sessionId, session: null };
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return { sessionId, session: null };
  }

  return { sessionId, session };
}

function createSession(user) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  sessions.set(sessionId, {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return sessionId;
}

function destroySession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(sessionId);
    }
  }
}

function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="app-shell">
    ${body}
  </main>
</body>
</html>`;
}

function loginPage(errorMessage = '') {
  const error = errorMessage
    ? `<div class="alert" role="alert">${escapeHtml(errorMessage)}</div>`
    : '';

  return layout('Login', `
    <section class="card auth-card">
      <p class="eyebrow">Session app</p>
      <h1>Sign in</h1>
      <p class="subtle">Use <code>demo</code> / <code>password123</code>.</p>
      ${error}
      <form method="post" action="/login" class="form">
        <label>
          <span>Username</span>
          <input name="username" autocomplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Log in</button>
      </form>
    </section>
  `);
}

function dashboardPage(user) {
  return layout('Dashboard', `
    <section class="card dashboard-card">
      <p class="eyebrow">Authenticated</p>
      <h1>Welcome, ${escapeHtml(user.displayName)}</h1>
      <p class="subtle">You are logged in as <strong>${escapeHtml(user.username)}</strong>.</p>
      <div class="session-grid">
        <div>
          <span class="label">Status</span>
          <p>Session active</p>
        </div>
        <div>
          <span class="label">Expires</span>
          <p>1 hour after sign in</p>
        </div>
      </div>
      <form method="post" action="/logout">
        <button type="submit" class="secondary">Log out</button>
      </form>
    </section>
  `);
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function redirect(res, location, headers = {}) {
  res.writeHead(303, {
    Location: location,
    ...headers,
  });
  res.end();
}

function serveStyles(res) {
  const css = fs.readFileSync(STYLE_PATH, 'utf8');
  res.writeHead(200, {
    'Content-Type': 'text/css; charset=utf-8',
    'Content-Length': Buffer.byteLength(css),
  });
  res.end(css);
}

async function handleRequest(req, res) {
  clearExpiredSessions();

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { sessionId, session } = getSessionFromRequest(req);

  if (req.method === 'GET' && requestUrl.pathname === '/styles.css') {
    serveStyles(res);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/') {
    redirect(res, session ? '/dashboard' : '/login');
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/login') {
    if (session) {
      redirect(res, '/dashboard');
      return;
    }

    const error = requestUrl.searchParams.get('error') || '';
    send(res, 200, loginPage(error));
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/login') {
    if (session) {
      redirect(res, '/dashboard');
      return;
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      redirect(res, '/login?error=' + encodeURIComponent('Unsupported form submission.'));
      return;
    }

    const rawBody = await readBody(req);
    const form = new URLSearchParams(rawBody);
    const username = form.get('username')?.trim() || '';
    const password = form.get('password') || '';

    const validLogin = username === demoUser.username && password === demoUser.password;
    if (!validLogin) {
      redirect(res, '/login?error=' + encodeURIComponent('Invalid username or password.'));
      return;
    }

    const newSessionId = createSession({
      id: demoUser.id,
      username: demoUser.username,
      displayName: demoUser.displayName,
    });

    res.writeHead(303, {
      Location: '/dashboard',
      'Set-Cookie': serializeCookie(SESSION_COOKIE, newSessionId, {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: SESSION_TTL_MS / 1000,
      }),
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/dashboard') {
    if (!session) {
      redirect(res, '/login');
      return;
    }

    send(res, 200, dashboardPage(session.user));
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/logout') {
    destroySession(sessionId);
    res.writeHead(303, {
      Location: '/login',
      'Set-Cookie': serializeCookie(SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0,
      }),
    });
    res.end();
    return;
  }

  send(res, 404, layout('Not Found', '<section class="card"><h1>404</h1><p>Page not found.</p></section>'));
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    send(res, 500, layout('Error', '<section class="card"><h1>Server error</h1><p>Something went wrong.</p></section>'));
  });
});

server.listen(PORT, () => {
  console.log(`Session auth app running at http://localhost:${PORT}`);
});
