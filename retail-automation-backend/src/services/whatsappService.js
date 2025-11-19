let twilioClient = null;
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  // twilio not installed or not configured
}

/**
 * Send a WhatsApp text message to a single phone number using Twilio (if configured)
 * Phone number should be in international format without '+' (e.g., 919876543210) or with +
 */
const sendTextToNumber = async (toNumber, body) => {
  // Normalize number for Twilio WhatsApp channel
  const to = toNumber.startsWith('+') ? `whatsapp:${toNumber}` : `whatsapp:+${toNumber}`;
  const from = process.env.TWILIO_WHATSAPP_FROM ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : null;

  if (twilioClient && from) {
    try {
      const msg = await twilioClient.messages.create({
        from,
        to,
        body
      });
      return { success: true, sid: msg.sid };
    } catch (err) {
      console.error('Twilio send error', err?.message || err);
      throw err;
    }
  }

  // Fallback: log the message and pretend success (useful for local/dev)
  console.log('[WhatsApp][FALLBACK] to:', toNumber, 'body:', body);
  return { success: true, sid: 'fallback-1' };
};

/**
 * Send a WhatsApp image with caption to a single phone number using Twilio (if configured)
 * @param {string} toNumber - Recipient's phone number
 * @param {string} imageUrl - Image URL to send
 * @param {string} caption - Caption or message body
 */
const sendImageToNumber = async (toNumber, imageUrl, caption) => {
  const to = toNumber.startsWith('+') ? `whatsapp:${toNumber}` : `whatsapp:+${toNumber}`;
  const from = process.env.TWILIO_WHATSAPP_FROM ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : null;

  if (twilioClient && from) {
    try {
      const msg = await twilioClient.messages.create({
        from,
        to,
        body: caption,
        mediaUrl: [imageUrl]
      });
      return { success: true, sid: msg.sid };
    } catch (err) {
      console.error('Twilio send image error', err?.message || err);
      throw err;
    }
  }

  // Fallback: log the message and pretend success (useful for local/dev)
  console.log('[WhatsApp][FALLBACK][IMAGE] to:', toNumber, 'image:', imageUrl, 'caption:', caption);
  return { success: true, sid: 'fallback-image-1' };
};

module.exports = { sendTextToNumber, sendImageToNumber };
