const { createServer } = require('node:http');
const { createContactHandler } = require('./app');
const { createSmtpMailer } = require('./mailer');

function startServer(env = process.env) {
  const port = Number(env.PORT || 3000);
  const allowedOrigin = env.CORS_ORIGIN || '*';
  const mailer = createSmtpMailer(env);
  const handler = createContactHandler({
    sendEmail: mailer.sendContactEmail,
    allowedOrigin
  });

  const server = createServer(handler);

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer()
    .then((server) => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : process.env.PORT || 3000;
      console.log(`Contact backend listening on port ${port}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  startServer
};
