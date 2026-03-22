/**
 * SMS OTP Service
 * Uses Twilio if credentials are set, otherwise stubs to console log.
 */

const sendOtp = async (phone, otp, countryCode = '+91') => {
  const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE, NODE_ENV } = process.env;

  const fullPhone = `${countryCode}${phone}`;

  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    // Stub mode
    console.log(`[SMS STUB] OTP for ${fullPhone}: ${otp}`);
    return { success: true, stub: true };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      body: `Your Smart Clinic Queue OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: TWILIO_PHONE,
      to: fullPhone,
    });

    console.log(`[SMS] OTP sent to ${fullPhone}, SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`[SMS] Failed to send OTP to ${fullPhone}:`, err.message);
    throw new Error('Failed to send SMS. Please try again.');
  }
};

module.exports = { sendOtp };
