// Birthday WhatsApp scheduler
const cron = require('node-cron');
const { Customer } = require('./models');
const whatsappService = require('./services/whatsappService');

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async() => {
    try {
        const today = new Date();
        const month = today.getMonth() + 1; // JS months are 0-based
        const day = today.getDate();
        // Find customers with birthday today and WhatsApp opt-in
        const customers = await Customer.findAll({
            where: {
                whatsapp_opt_in: true,
                date_of_birth: {
                    // Only match month and day, ignore year
                    $like: `%-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                }
            }
        });
        const axios = require('axios');
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken || !phoneNumberId) {
            console.error('[Birthday] WhatsApp credentials not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env');
            return;
        }
        for (const customer of customers) {
            const msg = `Happy Birthday, ${customer.name}! 🎉\nWishing you a wonderful year ahead. - Your Store Team`;
            try {
                // Normalize phone number: remove +, keep only digits
                let phoneToSend = customer.mobile_number;
                if (phoneToSend.startsWith('+')) {
                    phoneToSend = phoneToSend.substring(1);
                }
                if (phoneToSend.length === 10) {
                    phoneToSend = '91' + phoneToSend; // Add India country code
                }

                await axios.post(
                    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                        messaging_product: 'whatsapp',
                        to: phoneToSend,
                        type: 'text',
                        text: { body: msg }
                    }, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(`[Birthday] WhatsApp sent to ${phoneToSend}`);
            } catch (e) {
                console.error(`[Birthday] WhatsApp failed for ${customer.mobile_number}:`, e ? .response ? .data || e ? .message || e);
            }
        }
    } catch (err) {
        console.error('[Birthday] Scheduler error:', err);
    }
});

console.log('[Birthday] WhatsApp birthday scheduler started.');