const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-image-upload-'));

process.env.PROFILE_IMAGE_STORAGE_DIR = tempDir;
process.env.MAX_UPLOAD_BYTES = '128';

const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function tinyPng() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5B1JcAAAAASUVORK5CYII=',
    'base64'
  );
}

test('uploads and serves a profile image', async () => {
  const file = tinyPng();
  const form = new FormData();
  form.append('image', new Blob([file], { type: 'image/png' }), 'avatar.png');

  const uploadResponse = await fetch(`${baseUrl}/users/user_123/profile-image`, {
    method: 'POST',
    body: form
  });

  assert.equal(uploadResponse.status, 201);

  const payload = await uploadResponse.json();
  assert.equal(payload.data.userId, 'user_123');
  assert.equal(payload.data.mimeType, 'image/png');

  const fetchResponse = await fetch(`${baseUrl}/users/user_123/profile-image`);
  assert.equal(fetchResponse.status, 200);
  assert.equal(fetchResponse.headers.get('content-type'), 'image/png');

  const served = Buffer.from(await fetchResponse.arrayBuffer());
  assert.deepEqual(served, file);
});

test('rejects non-image content', async () => {
  const form = new FormData();
  form.append('image', new Blob([Buffer.from('not an image')], { type: 'image/png' }), 'avatar.png');

  const response = await fetch(`${baseUrl}/users/user_456/profile-image`, {
    method: 'POST',
    body: form
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.message, 'Only JPEG, PNG, and WebP images are allowed');
});

test('rejects oversized uploads', async () => {
  const file = Buffer.concat([tinyPng(), Buffer.alloc(200)]);
  const form = new FormData();
  form.append('image', new Blob([file], { type: 'image/png' }), 'avatar.png');

  const response = await fetch(`${baseUrl}/users/user_789/profile-image`, {
    method: 'POST',
    body: form
  });

  assert.equal(response.status, 413);
});

test('rejects invalid user ids', async () => {
  const form = new FormData();
  form.append('image', new Blob([tinyPng()], { type: 'image/png' }), 'avatar.png');

  const response = await fetch(`${baseUrl}/users/bad../profile-image`, {
    method: 'POST',
    body: form
  });

  assert.equal(response.status, 400);
});
