/**
 * Email OTP Service
 * Uses Nodemailer with Gmail / SMTP to send 4-digit OTPs to patients.
 *
 * Required env vars:
 *   EMAIL_HOST      – smtp.gmail.com  (or any SMTP host)
 *   EMAIL_PORT      – 587
 *   EMAIL_USER      – your-email@gmail.com
 *   EMAIL_PASS      – Gmail App Password (16-char, no spaces)
 *   EMAIL_FROM      – "Smart Clinic Queue <your-email@gmail.com>"
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    // Stub mode – logs OTP to console only
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(EMAIL_PORT || '587', 10),
    secure: parseInt(EMAIL_PORT || '587', 10) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return _transporter;
}

/**
 * Send an OTP email to the patient.
 * @param {string} email  – recipient email address
 * @param {string} otp    – 4-digit OTP string
 * @param {string} clinicName – clinic name for the message body
 */
const sendOtpEmail = async (email, otp, clinicName = 'Smart Clinic') => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[EMAIL STUB] OTP for ${email}: ${otp}`);
    return { success: true, stub: true };
  }

  const fromAddr = process.env.EMAIL_FROM || `"${clinicName}" <${process.env.EMAIL_USER}>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:40px;">🏥</span>
        <h2 style="margin:8px 0 4px;color:#0f172a;">${clinicName}</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Queue Management System</p>
      </div>
      <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="color:#475569;font-size:15px;margin:0 0 16px;">Your One-Time Password (OTP) is:</p>
        <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#3B82F6;font-family:'Courier New',monospace;">${otp}</div>
        <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <p style="color:#cbd5e1;font-size:12px;text-align:center;margin-top:20px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddr,
      to: email,
      subject: `${otp} – Your OTP for ${clinicName}`,
      html,
      text: `Your OTP for ${clinicName} is: ${otp}\nThis OTP is valid for 5 minutes.`,
    });

    console.log(`[EMAIL] OTP sent to ${email}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send OTP to ${email}:`, err.message);
    throw new Error('Failed to send email OTP. Please try again.');
  }
};

module.exports = { sendOtpEmail };
