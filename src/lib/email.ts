import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpUser = process.env.SMTP_USER || "dnsxmrs@gmail.com";
const smtpPass = process.env.SMTP_PASS || "wdjspmbhdyogkiij";
const smtpFrom = process.env.SMTP_FROM || "Class Attendance Management System <dnsxmrs@gmail.com>";

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Modern HTML Template for Verification Link & OTP
 */
export function getVerificationEmailTemplate({
  name,
  url,
  otp,
  title,
  subtitle,
}: {
  name?: string;
  url?: string;
  otp?: string;
  title?: string;
  subtitle?: string;
}) {
  const recipientName = name || "Teacher";
  const mainTitle = title || "Verify Your Email Address";
  const otpLabel = subtitle || "Your 6-Digit Verification Code";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mainTitle}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
      
      <!-- Brand Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; font-weight: 800; font-size: 20px; padding: 10px 18px; border-radius: 12px; letter-spacing: -0.5px;">
          CAMS
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 16px; margin-bottom: 6px;">${mainTitle}</h1>
        <p style="font-size: 14px; color: #64748b; margin: 0;">Class Attendance Management System</p>
      </div>

      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
        Hello <strong>${recipientName}</strong>,<br>
        ${
          title?.toLowerCase().includes("reset")
            ? "We received a request to reset your CAMS account password. Please use the security code below to complete your password reset."
            : "Thank you for using CAMS. Please verify your email address to access your teacher dashboard."
        }
      </p>

      ${
        otp
          ? `
      <!-- OTP Code Box -->
      <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 8px;">${otpLabel}</span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${otp}</span>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 8px; margin-bottom: 0;">This OTP code expires in 10 minutes.</p>
      </div>
      `
          : ""
      }

      ${
        url
          ? `
      <!-- Verification Link Button -->
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; word-break: break-all; text-align: center; margin-bottom: 24px;">
        Or copy and paste this link into your browser:<br>
        <a href="${url}" style="color: #2563eb; text-decoration: underline;">${url}</a>
      </p>
      `
          : ""
      }

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;">

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        If you did not request this email, please ignore it or contact system support.
      </p>
    </div>
  </body>
  </html>
  `;
}
