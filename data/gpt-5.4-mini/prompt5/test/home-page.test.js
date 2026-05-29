const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-image-home-'));

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

test('serves the tester webpage at the root route', async () => {
  const response = await fetch(baseUrl + '/');

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);

  const html = await response.text();
  assert.match(html, /Profile Image Tester/);
  assert.match(html, /Upload/);
});
