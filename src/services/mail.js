require("dotenv").config();
const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set. Emails will fail.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const FROM = process.env.SENDGRID_FROM_EMAIL || "support@financetequecv.com";
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const ASSET_BASE_URL = process.env.ASSET_BASE_URL || APP_URL;
// Place logo at your frontend public/logo.png or set LOGO_URL explicitly
const LOGO_URL = process.env.LOGO_URL || `${ASSET_BASE_URL}/logo.png`;

// Brand
const BRAND = {
  primary: "#d4af37",
  primaryDark: "#b8941f",
  lightBg: "#fff8dc",
  dark: "#1a1a1a",
};

// Utilities
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bulletproofButton = ({ href, label }) => `
  <!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="8%" fillcolor="${
  BRAND.primary
}" strokecolor="${BRAND.primary}">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${esc(
      label
    )}</center>
  </v:roundrect>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <a href="${href}" target="_blank" class="btn"
     style="background-color:${
       BRAND.primary
     }; color:#ffffff; font-weight:bold; text-decoration:none; padding:14px 30px; border-radius:6px; display:inline-block; font-size:16px;">
    ${esc(label)}
  </a>
  <!--<![endif]-->
`;

const baseTemplate = ({ title, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
    @media only screen and (max-width:600px){
      .container-pad { padding:24px !important; }
      h1 { font-size:20px !important; }
      .btn { display:block !important; padding:12px 20px !important; }
    }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    img { border:0; outline:none; text-decoration:none; }
    table { border-collapse:collapse; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${
  BRAND.lightBg
}; font-family:Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${
    BRAND.lightBg
  }">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
               style="max-width:600px; background-color:#ffffff; border-radius:10px; box-shadow:0 4px 6px rgba(0,0,0,0.08); overflow:hidden;">
          <tr>
            <td style="background-color:${
              BRAND.primary
            }; padding:20px 32px; text-align:center;">
              <img src="${LOGO_URL}" alt="Finance Teque" width="180"
                   style="max-width:180px; width:100%; height:auto; display:block; margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td class="container-pad" style="padding:36px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 36px;">
              <div style="border-top:1px solid #eeeeee; padding-top:16px; text-align:center; color:#666666; font-size:13px; line-height:1.5;">
                <p style="margin:0 0 8px;">Best regards,<br><strong>Finance Teque Team</strong></p>
                <p style="margin:0 0 8px; color:#888888;">18B. Fatima Plaza, Second Floor, Murtala Muhammad Way, Kano, Nigeria</p>
                <p style="margin:0; color:#888888;">&copy; ${new Date().getFullYear()} Finance Teque Investment Growth. All rights reserved.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Sections
const otpSection = ({ name, otp }) => `
  <h1 style="color:${
    BRAND.dark
  }; font-size:24px; margin:0 0 16px; text-align:center;">Your Verification Code</h1>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">Hello ${esc(
    name
  )},</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">
    Use the verification code below to complete your request:
  </p>
  <div style="background-color:#f9f9f9; border:1px solid #eeeeee; border-radius:6px; padding:18px; margin:20px 0; text-align:center;">
    <span style="font-size:32px; font-weight:bold; letter-spacing:6px; color:${
      BRAND.primary
    };">${esc(otp)}</span>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">This code expires in <strong>10 minutes</strong>.</p>
  <p style="color:#666666; font-size:14px; line-height:1.6; margin:0;">If you didn’t request this, please ignore this email.</p>
`;

const resetSection = ({ name, resetUrl }) => `
  <h1 style="color:${
    BRAND.dark
  }; font-size:24px; margin:0 0 16px; text-align:center;">Password Reset Request</h1>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">Hello ${esc(
    name
  )},</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 24px;">
    We received a request to reset your password. Click the button below to set a new password.
  </p>
  <div style="text-align:center; margin:24px 0;">
    ${bulletproofButton({ href: resetUrl, label: "Reset Password" })}
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">
    This link expires in <strong>30 minutes</strong>. If you didn’t request this, ignore this email.
  </p>
  <p style="color:#333333; font-size:14px; line-height:1.6; margin:16px 0 6px;">Or copy and paste this URL:</p>
  <p style="font-size:12px; line-height:1.5; color:#666666; word-break:break-all; margin:0;">${esc(
    resetUrl
  )}</p>
`;

const welcomeSection = ({ name }) => `
  <h1 style="color:${
    BRAND.dark
  }; font-size:24px; margin:0 0 16px; text-align:center;">Welcome to Finance Teque!</h1>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">Hello ${esc(
    name
  )},</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px;">
    We’re excited to have you with us. Explore ethical investment opportunities and track your portfolio with ease.
  </p>
  <div style="text-align:center; margin:24px 0;">
    ${bulletproofButton({
      href: `${APP_URL}/dashboard`,
      label: "Access Your Account",
    })}
  </div>
  <ul style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 16px; padding-left:20px;">
    <li style="margin-bottom:8px;">Access ethical investment opportunities</li>
    <li style="margin-bottom:8px;">Get financing for your business</li>
    <li style="margin-bottom:8px;">Connect with strategic partners</li>
    <li style="margin-bottom:8px;">Track your portfolio performance</li>
  </ul>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0;">Need help? Reply to this email.</p>
`;

// Public API
async function sendVerificationEmail(to, code) {
  const name = to.split("@")[0];
  const html = baseTemplate({
    title: "Your Verification Code",
    bodyHtml: otpSection({ name, otp: code }),
  });

  const msg = {
    to,
    from: FROM,
    subject: "Your verification code",
    text: `Hello ${name},\n\nYour OTP is: ${code}\n\nThe code expires in 10 minutes.\n\nIf you didn’t request this, ignore this email.`,
    html,
  };
  await sgMail.send(msg);
}

async function sendResetPasswordEmail(to, token) {
  const name = to.split("@")[0];
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(
    token
  )}`;
  const html = baseTemplate({
    title: "Reset Your Password",
    bodyHtml: resetSection({ name, resetUrl }),
  });

  const msg = {
    to,
    from: FROM,
    subject: "Password reset request",
    text: `Hello ${name},\n\nUse this link to reset your password (expires in 30 minutes):\n${resetUrl}\n\nIf you didn’t request this, ignore this email.`,
    html,
  };
  await sgMail.send(msg);
}

async function sendWelcomeEmail(to, name = to.split("@")[0]) {
  const html = baseTemplate({
    title: "Welcome to Finance Teque",
    bodyHtml: welcomeSection({ name }),
  });

  const msg = {
    to,
    from: FROM,
    subject: "Welcome to Finance Teque",
    text: `Hello ${name},\n\nWelcome to Finance Teque! Access your account:\n${APP_URL}/dashboard\n\nWe’re glad you’re here.`,
    html,
  };
  await sgMail.send(msg);
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
};
