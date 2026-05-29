const nodemailer = require('nodemailer');
const config = require('../config');

function createTransport() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

async function sendContactEmail({ name, email, subject, message }) {
  const transport = createTransport();

  const mailOptions = {
    from: `"${name}" <${config.email.user}>`,
    replyTo: email,
    to: config.contactRecipient,
    subject: `[Contact Form] ${subject}`,
    text: `You have received a new message from your website contact form:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Subject</td><td style="padding:8px">${escapeHtml(subject)}</td></tr>
      </table>
      <h3>Message</h3>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
  };

  return transport.sendMail(mailOptions);
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { sendContactEmail };
