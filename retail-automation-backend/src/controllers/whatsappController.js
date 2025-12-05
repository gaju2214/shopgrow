const axios = require('axios');
const { WhatsAppMessage, Customer } = require('../models');
const whatsappService = require('../services/whatsappService');

/**
 * Send custom WhatsApp message to customer
 * POST /api/whatsapp/send
 * Body: { customerId?, customerPhone, customMessage }
 */
exports.sendMessage = async (req, res) => {
  try {
    const storeId = req.store_id; // From auth middleware
    const { customerId, customerPhone, customMessage } = req.body;

    if (!customerPhone || !customMessage) {
      return res.status(400).json({ error: 'customerPhone and customMessage required' });
    }

    // Send message via WhatsApp service
    const messageData = await whatsappService.sendMessage(customerPhone, customMessage);

    // Record in database
    const whatsappMsg = await WhatsAppMessage.create({
      store_id: storeId,
      customer_id: customerId || null,
      customer_phone: customerPhone,
      message_text: customMessage,
      status: 'sent',
      trigger_type: 'manual',
      sent_at: new Date()
    });

    res.json({ success: true, messageId: whatsappMsg.id, meta: messageData });
  } catch (error) {
    console.error('[WhatsApp] sendMessage error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all WhatsApp messages for store
 * GET /api/whatsapp/messages?page=1&limit=20&status=sent
 */
exports.getMessages = async (req, res) => {
  try {
    const storeId = req.store_id; // From auth middleware
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let where = { store_id: storeId };
    if (status) where.status = status;

    const { count, rows } = await WhatsAppMessage.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      messages: rows,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    console.error('[WhatsApp] getMessages error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Trigger stock update broadcast to opted-in customers
 * POST /api/whatsapp/broadcast-stock-update
 * Body: { productId, productName, newStock }
 */
exports.triggerStockUpdate = async (req, res) => {
  try {
    const storeId = req.store_id; // From auth middleware
    const { productId, productName, newStock } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ error: 'productId and productName required' });
    }

    // Find all opted-in customers for this store
    const customers = await Customer.findAll({
      where: { store_id: storeId, whatsapp_opt_in: true }
    });

    const message = `${productName} is back in stock with ${newStock} units! 🎉 Check it out now.`;
    const results = [];

    for (const customer of customers) {
      try {
        const phoneNumber = customer.mobile_number;
        const messageData = await whatsappService.sendMessage(phoneNumber, message);

        // Record in database
        await WhatsAppMessage.create({
          store_id: storeId,
          customer_id: customer.id,
          customer_phone: phoneNumber,
          message_text: message,
          status: 'sent',
          trigger_type: 'stock_update',
          sent_at: new Date()
        });

        results.push({ customerId: customer.id, phone: phoneNumber, status: 'sent' });
      } catch (e) {
        results.push({ customerId: customer.id, phone: customer.mobile_number, status: 'failed', error: e.message });
      }
    }

    res.json({ success: true, message: 'Broadcast initiated', results });
  } catch (error) {
    console.error('[WhatsApp] triggerStockUpdate error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Send WhatsApp video message (Legacy - for backward compatibility)
 */
exports.sendVideoMessage = async (req, res) => {
  const { to, video_link, caption } = req.body;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return res.status(400).json({ error: 'WhatsApp credentials not configured' });
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'video',
        video: { link: video_link, caption: caption || '' }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('[WhatsApp] sendVideoMessage error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

/**
 * Send WhatsApp template message (Legacy - for backward compatibility)
 */
exports.sendTemplateMessage = async (req, res) => {
  const { to, template_name, language_code } = req.body;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return res.status(400).json({ error: 'WhatsApp credentials not configured' });
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: template_name || 'hello_world', language: { code: language_code || 'en_US' } }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('[WhatsApp] sendTemplateMessage error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

/**
 * Send WhatsApp image message (Legacy - for backward compatibility)
 */
exports.sendImageMessage = async (req, res) => {
  const { to, image_link, caption } = req.body;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return res.status(400).json({ error: 'WhatsApp credentials not configured' });
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: image_link, caption: caption || '' }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('[WhatsApp] sendImageMessage error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

/**
 * Manual endpoint to test birthday WhatsApp messages
 */
exports.testBirthdayMessage = async (req, res) => {
  try {
    const storeId = req.store_id; // From auth middleware
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const customers = await Customer.findAll({
      where: {
        store_id: storeId,
        whatsapp_opt_in: true,
        date_of_birth: {
          $like: `%-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        }
      }
    });

    const results = [];
    for (const customer of customers) {
      try {
        const phoneNumber = customer.mobile_number;
        const msg = `Happy Birthday, ${customer.name}! 🎉 Wishing you a wonderful year ahead. - Your Store Team`;
        await whatsappService.sendMessage(phoneNumber, msg);
        results.push({ phone: phoneNumber, status: 'sent' });
      } catch (e) {
        results.push({ phone: customer.mobile_number, status: 'failed', error: e.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('[WhatsApp] testBirthdayMessage error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
