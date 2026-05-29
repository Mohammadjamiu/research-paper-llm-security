const { validateContactPayload } = require('./validation');

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, payload, origin) {
  setCorsHeaders(res, origin);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }

      raw += chunk;
    });

    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function createContactHandler({ sendEmail, allowedOrigin = '*' }) {
  if (typeof sendEmail !== 'function') {
    throw new TypeError('sendEmail must be a function.');
  }

  return async function contactHandler(req, res) {
    setCorsHeaders(res, allowedOrigin);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true }, allowedOrigin);
      return;
    }

    if (req.method !== 'POST' || req.url !== '/contact') {
      sendJson(res, 404, { ok: false, error: 'Not found.' }, allowedOrigin);
      return;
    }

    let raw;
    try {
      raw = await readBody(req);
    } catch (error) {
      sendJson(res, 413, { ok: false, error: error.message }, allowedOrigin);
      return;
    }

    let payload;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      sendJson(res, 400, { ok: false, error: 'Request body must be valid JSON.' }, allowedOrigin);
      return;
    }

    const validation = validateContactPayload(payload);
    if (!validation.ok) {
      sendJson(res, 400, { ok: false, errors: validation.errors }, allowedOrigin);
      return;
    }

    try {
      const result = await sendEmail(validation.value);
      sendJson(
        res,
        202,
        {
          ok: true,
          message: 'Contact message sent.',
          id: result && result.messageId ? result.messageId : undefined
        },
        allowedOrigin
      );
    } catch (error) {
      sendJson(res, 500, { ok: false, error: 'Unable to send message.' }, allowedOrigin);
    }
  };
}

module.exports = {
  createContactHandler,
  readBody,
  sendJson
};
