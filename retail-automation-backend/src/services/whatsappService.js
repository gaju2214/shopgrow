/**
 * WhatsApp Service
 * Handles Meta Cloud API integration for WhatsApp messaging
 */

const axios = require('axios');

const WHATSAPP_API_BASE = 'https://graph.facebook.com/v22.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Normalize phone number to E.164 format
 * Assumes India (+91) if no country code provided
 */
const normalizePhoneNumber = (phoneNumber) => {
  let normalized = phoneNumber.trim();

  // Remove + if present
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }

  // Remove all non-digits
  normalized = normalized.replace(/\D/g, '');

  // If 10 digits (Indian mobile), add country code
  if (normalized.length === 10) {
    normalized = '91' + normalized;
  }

  // If doesn't start with country code, assume 91 (India)
  if (!normalized.startsWith('91') && normalized.length <= 10) {
    normalized = '91' + normalized;
  }

  return normalized;
};

/**
 * Send plain text message via WhatsApp Meta API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} messageText - Message content
 * @returns {Promise<Object>} Response from Meta API
 */
exports.sendMessage = async (phoneNumber, messageText) => {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing)');
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: messageText }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Message sent to ${normalizedPhone}:`, response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] sendMessage error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send template message via WhatsApp Meta API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} templateName - Template name in WhatsApp Business Account
 * @param {Array} parameters - Template variables array
 * @returns {Promise<Object>} Response from Meta API
 */
exports.sendTemplate = async (phoneNumber, templateName, parameters = []) => {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured');
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const payload = {
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' }
      }
    };

    // Add parameters if provided
    if (parameters.length > 0) {
      payload.template.components = [
        {
          type: 'body',
          parameters: parameters.map(p => ({ type: 'text', text: p }))
        }
      ];
    }

    const response = await axios.post(
      `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Template sent to ${normalizedPhone}:`, response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] sendTemplate error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send birthday template message (for compatibility)
 */
exports.sendBirthdayTemplate = async (toNumber, name) => {
  try {
    const normalized = normalizePhoneNumber(toNumber);
    const templateName = process.env.WHATSAPP_BIRTHDAY_TEMPLATE || 'birthday_greeting';
    const response = await this.sendTemplate(normalized, templateName, [name]);
    return { success: true, data: response };
  } catch (error) {
    console.error('[WhatsApp] sendBirthdayTemplate error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send image message via WhatsApp Meta API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} imageUrl - Image URL
 * @param {string} caption - Image caption (optional)
 * @returns {Promise<Object>} Response from Meta API
 */
exports.sendImage = async (phoneNumber, imageUrl, caption = '') => {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured');
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'image',
        image: { link: imageUrl, caption: caption }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Image sent to ${normalizedPhone}:`, response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] sendImage error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send video message via WhatsApp Meta API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} videoUrl - Video URL
 * @param {string} caption - Video caption (optional)
 * @returns {Promise<Object>} Response from Meta API
 */
exports.sendVideo = async (phoneNumber, videoUrl, caption = '') => {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WhatsApp credentials not configured');
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const response = await axios.post(
      `${WHATSAPP_API_BASE}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'video',
        video: { link: videoUrl, caption: caption }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Video sent to ${normalizedPhone}:`, response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp] sendVideo error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Parse webhook data from WhatsApp
 * @param {Object} webhookData - Incoming webhook payload
 * @returns {Object} Parsed message data
 */
exports.parseWebhook = (webhookData) => {
  try {
    const entry = webhookData.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      return null; // Not a message event
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    return {
      messageId: message.id,
      timestamp: message.timestamp,
      from: message.from,
      type: message.type,
      text: message.text?.body,
      contact: {
        name: contact?.name,
        phone: message.from
      }
    };
  } catch (error) {
    console.error('[WhatsApp] parseWebhook error:', error.message);
    return null;
  }
};

/**
 * Update message status based on webhook delivery notification
 * @param {string} messageId - WhatsApp message ID
 * @param {string} status - 'sent', 'delivered', 'read', 'failed'
 * @returns {Promise<Object>} Updated message record
 */
exports.updateMessageStatus = async (messageId, status) => {
  try {
    const { WhatsAppMessage } = require('../models');

    const message = await WhatsAppMessage.update(
      {
        status: status,
        sent_at: status === 'sent' ? new Date() : undefined,
        delivered_at: status === 'delivered' ? new Date() : undefined,
        read_at: status === 'read' ? new Date() : undefined
      },
      {
        where: { meta_message_id: messageId }
      }
    );

    console.log(`[WhatsApp] Message ${messageId} updated to status: ${status}`);
    return message;
  } catch (error) {
    console.error('[WhatsApp] updateMessageStatus error:', error.message);
    throw error;
  }
};

// Maintain backward compatibility with old export names
exports.sendTextToNumber = exports.sendMessage;
exports.sendImageToNumber = exports.sendImage;
exports.sendVideoToNumber = exports.sendVideo;
