/**
 * WhatsApp OTP Service
 * Uses Meta WhatsApp Cloud API via axios.
 */
const axios = require('axios');

const sendOtp = async (phone, otp, countryCode = '+91') => {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  // Format phone number by removing any non-digit characters (e.g., '+')
  const cleanCountryCode = countryCode.replace(/\D/g, '');
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = `${cleanCountryCode}${cleanPhone}`;

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    // Stub mode if credentials are not configured
    console.log(`[WHATSAPP STUB] OTP for ${fullPhone}: ${otp}`);
    return { success: true, stub: true };
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    // Using Meta WhatsApp Cloud API template format
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_auth';

    const data = {
      messaging_product: 'whatsapp',
      to: fullPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US'
        }
      }
    };

    // If it's a real OTP template, add the parameters with the OTP
    if (templateName !== 'hello_world') {
      data.template.components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: otp
            }
          ]
        }
      ];
    }

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[WHATSAPP] OTP sent to ${fullPhone}, Message ID: ${response.data.messages[0].id}`);
    return { success: true, messageId: response.data.messages[0].id };
  } catch (err) {
    console.error(`[WHATSAPP] Failed to send OTP to ${fullPhone}:`, err.response?.data || err.message);
    throw new Error('Failed to send WhatsApp OTP. Please try again.');
  }
};

module.exports = { sendOtp };
