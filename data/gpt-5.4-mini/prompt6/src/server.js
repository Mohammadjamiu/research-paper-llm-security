const http = require('http');
const config = require('./config');
const { loadDb } = require('./store');
const { handleRequest } = require('./router');
const { HttpError } = require('./errors');
const { error } = require('./utils/http');

loadDb();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    await handleRequest(req, res, url);
  } catch (err) {
    const statusCode = err instanceof HttpError ? err.statusCode : 500;
    const message = err instanceof HttpError ? err.message : 'Internal server error';
    const details = err instanceof HttpError ? err.details : undefined;
    if (statusCode === 500) {
      console.error(err);
    }
    error(res, statusCode, message, details);
  }
});

server.listen(config.port, () => {
  console.log(`Admin dashboard backend running on http://localhost:${config.port}`);
});
