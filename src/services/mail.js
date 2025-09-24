require("dotenv").config();
const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set. Emails will fail.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
// sgMail.setDataResidency('eu'); // Uncomment if using EU subuser

const FROM = process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com";

async function sendVerificationEmail(to, code) {
  const msg = {
    to,
    from: FROM,
    subject: "Your verification code",
    text: `Hello ${to},\n\nYour OTP is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.\n\nBest regards,\nFinance Teque Security Team`,
    html: verifytemplate(to, code),
  };
  await sgMail.send(msg);
}

const verifytemplate = (user, code) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Your OTP Code</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
      <h2 style="color: #333; text-align: center;">Your OTP Code</h2>
      <p>Hello <strong>${user}</strong>,</p>
      <p style="font-size: 16px; color: #333;">
        Your one-time password (OTP) is:
      </p>
      <p style="font-size: 24px; font-weight: bold; text-align: center; color: #2c7be5;">
       ${code}
      </p>
      <p style="font-size: 14px; color: #555;">
        This code will expire in <strong>10 minutes</strong>.
        <br />
        If you did not request this, please ignore this email.
      </p>
      <p style="margin-top: 30px; font-size: 14px; color: #333;">
        Best regards,<br />
        <strong>Your Company Name Security Team</strong>
      </p>
    </div>
  </body>
</html>
`;

async function sendResetPasswordEmail(to, token) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(
    token
  )}`;

  const msg = {
    to,
    from: FROM,
    subject: "Password reset request",
    text: `You requested a password reset. Use this link to set a new password: ${resetUrl}. This link expires in 10 minutes. If you did not request this, please ignore this email.`,
    html: resettemplate(to),
  };

  const resettemplate = (user) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
      <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
      <p>Hello <strong>${user}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href=${resetUrl} target="_blank"
           style="background-color: #2c7be5; color: #ffffff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in <strong>30 minutes</strong>.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p style="margin-top: 30px; font-size: 14px; color: #333;">
        Best regards,<br>
        <strong>Your Company Security Team</strong>
      </p>
    </div>
  </body>
</html>
`;

  await sgMail.send(msg);
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
