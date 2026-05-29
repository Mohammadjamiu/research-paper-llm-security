const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const useEthereal = !process.env.SMTP_USER;

  if (useEthereal) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`\n📧 Ethereal email account created:`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}\n`);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendPasswordResetEmail({ to, token, baseUrl }) {
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const info = await (await getTransporter()).sendMail({
    from: process.env.FROM_EMAIL || 'noreply@example.com',
    to,
    subject: 'Password Reset Request',
    text: `You requested a password reset.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in ${process.env.TOKEN_EXPIRY_MINUTES || 60} minutes.\nIf you did not request this, please ignore this email.`,
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align:center;">
        <a href="${resetLink}"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
           Reset Password
        </a>
      </p>
      <p>This link expires in ${process.env.TOKEN_EXPIRY_MINUTES || 60} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  console.log(`📬 Password reset email sent to ${to}`);

  if (process.env.SMTP_USER) {
    console.log(`   URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
}

module.exports = { sendPasswordResetEmail };
