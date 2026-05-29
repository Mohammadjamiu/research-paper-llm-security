const nodemailer = require('nodemailer');

function createSmtpMailer(env = process.env) {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 587);
  const secure = String(env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.CONTACT_FROM || env.SMTP_FROM || user;
  const to = env.CONTACT_TO;
  const subjectPrefix = env.CONTACT_SUBJECT_PREFIX || '[Contact Form]';

  if (!host || !user || !pass || !from || !to) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_FROM, and CONTACT_TO are required.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });

  return {
    async sendContactEmail({ name, email, subject, message }) {
      const fullSubject = subject
        ? `${subjectPrefix} ${subject}`
        : `${subjectPrefix} New contact message`;

      return transporter.sendMail({
        from,
        to,
        replyTo: email,
        subject: fullSubject,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          subject ? `Subject: ${subject}` : null,
          '',
          message
        ]
          .filter(Boolean)
          .join('\n'),
        html: `
          <h2>New contact form message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ''}
          <p><strong>Message:</strong></p>
          <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>
        `
      });
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  createSmtpMailer,
  escapeHtml
};
