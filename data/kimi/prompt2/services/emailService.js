const nodemailer = require('nodemailer');

// Create transporter using environment variables or default to console logging
const createTransporter = () => {
  // If SMTP credentials are provided, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // For development, use ethereal.email (fake SMTP service)
  // This allows testing without real email credentials
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || 'test@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'testpass',
    },
  });
};

let transporter = null;

async function initializeTransporter() {
  try {
    transporter = createTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    console.log('Email transporter is ready to send messages');
  } catch (error) {
    console.warn('Email transporter initialization failed:', error.message);
    console.warn('Password reset emails will be logged to console instead');
    transporter = null;
  }
}

// Generate password reset email HTML template
function generateResetEmailTemplate(resetUrl, userEmail) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #007bff;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }
        .url-fallback {
            word-break: break-all;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We received a request to reset the password for your account (${userEmail}). If you made this request, please click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div class="url-fallback">${resetUrl}</div>
            
            <div class="warning">
                <strong>Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour</li>
                    <li>This link can only be used once</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>For security, we recommend changing your password regularly</li>
                </ul>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Application. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send password reset email
async function sendPasswordResetEmail(userEmail, resetToken) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@example.com',
    to: userEmail,
    subject: 'Password Reset Request',
    html: generateResetEmailTemplate(resetUrl, userEmail),
    text: `Password Reset Request

Hello,

We received a request to reset the password for your account (${userEmail}).

Please click the following link to reset your password:
${resetUrl}

This link will expire in 1 hour and can only be used once.

If you didn't request this reset, please ignore this email.

---
This is an automated message, please do not reply.
`,
  };

  try {
    if (!transporter) {
      // Log email to console if transporter is not available
      console.log('\n========== PASSWORD RESET EMAIL ==========');
      console.log('To:', userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('Reset URL:', resetUrl);
      console.log('==========================================\n');
      return { success: true, preview: true, resetUrl };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    // If using ethereal.email, log the preview URL
    if (info.ethereal) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Send password changed confirmation email
async function sendPasswordChangedEmail(userEmail) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@example.com',
    to: userEmail,
    subject: 'Password Successfully Changed',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
            text-align: center;
            padding: 20px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            color: #155724;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">
            <h2>Password Successfully Changed</h2>
            <p>Your password has been updated successfully.</p>
        </div>
        <p>Hello,</p>
        <p>This email confirms that the password for your account (${userEmail}) has been changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
    </div>
</body>
</html>
    `,
    text: `Password Successfully Changed

Hello,

This email confirms that the password for your account (${userEmail}) has been changed.

If you did not make this change, please contact our support team immediately.
`,
  };

  try {
    if (!transporter) {
      console.log('\n========== PASSWORD CHANGED EMAIL ==========');
      console.log('To:', userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('============================================\n');
      return { success: true, preview: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Password changed email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error here - password was already changed
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeTransporter,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
