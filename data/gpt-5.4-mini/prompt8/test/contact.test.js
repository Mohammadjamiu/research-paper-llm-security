const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { createContactHandler } = require('../src/app');

function startTestServer(handler) {
  const server = createServer(handler);

  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

test('rejects invalid contact payloads', async () => {
  const calls = [];
  const handler = createContactHandler({
    sendEmail: async (payload) => {
      calls.push(payload);
    }
  });

  const { server, baseUrl } = await startTestServer(handler);

  try {
    const response = await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        message: 'hi'
      })
    });

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.errors.name);
    assert.ok(body.errors.email);
    assert.ok(body.errors.message);
    assert.equal(calls.length, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('accepts valid contact payloads and sends email', async () => {
  const calls = [];
  const handler = createContactHandler({
    sendEmail: async (payload) => {
      calls.push(payload);
      return { messageId: 'abc123' };
    }
  });

  const { server, baseUrl } = await startTestServer(handler);

  try {
    const response = await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        subject: 'Hello',
        message: 'This is a valid contact form message.'
      })
    });

    const body = await response.json();

    assert.equal(response.status, 202);
    assert.equal(body.ok, true);
    assert.equal(body.id, 'abc123');
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Hello',
      message: 'This is a valid contact form message.'
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('returns health check response', async () => {
  const handler = createContactHandler({
    sendEmail: async () => ({ messageId: 'unused' })
  });

  const { server, baseUrl } = await startTestServer(handler);

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
