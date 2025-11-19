const Queue = require('bull');
const { MarketingQueue, Store, Product, Customer } = require('../models');
const instagramService = require('../services/instagramService');
const whatsappService = require('../services/whatsappService');

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const mq = new Queue('marketing-queue', REDIS_URL);

// Process jobs
mq.process(async (job) => {
  const { mqId } = job.data;
  if (!mqId) throw new Error('Missing mqId in job');

  const row = await MarketingQueue.findByPk(mqId);
  if (!row) throw new Error('MarketingQueue row not found: ' + mqId);

  try {
    await row.update({ status: 'processing' });

    const store = await Store.findByPk(row.store_id);
    const payload = row.payload || {};

    // If WhatsApp messaging requested, send to opted-in customers
    if (row.send_whatsapp) {
      const customers = await Customer.findAll({
        where: { store_id: row.store_id, whatsapp_opt_in: true }
      });

      // Prepare product info for WhatsApp message
      const product = payload.productId ? await Product.findByPk(payload.productId) : null;
      const caption = payload.caption || (product ? `New stock: ${product.name}` : (payload.title || ''));
      const images = payload.images || (product ? product.image_urls || [] : []);
      const imageUrl = images.length > 0 ? images[0] : null;

      for (const c of customers) {
        try {
          if (imageUrl) {
            await whatsappService.sendImageToNumber(c.mobile_number, imageUrl, caption);
          } else {
            await whatsappService.sendTextToNumber(c.mobile_number, caption);
          }
        } catch (err) {
          console.error('Failed to send whatsapp to', c.mobile_number, err?.message || err);
        }
      }
    }

    // If Instagram publishing requested, require approval unless already approved
    if (row.send_instagram) {
      if (!row.requires_approval || row.approved) {
        // Prepare product info for caption
        const product = payload.productId ? await Product.findByPk(payload.productId) : null;
        const caption = payload.caption || (product ? `New stock: ${product.name}` : (payload.title || '')); 
        const images = payload.images || (product ? product.image_urls || [] : []);

        try {
          await instagramService.publishStockUpdate({ store, product, caption, images });
        } catch (err) {
          console.error('Instagram publish failed', err?.message || err);
          throw err;
        }
      } else {
        // Not approved yet; requeue or skip
        console.log('Instagram post requires approval, skipping until approved', row.id);
      }
    }

    await row.update({ status: 'sent', error: null });
    return Promise.resolve();
  } catch (err) {
    console.error('Job processing error', err?.message || err);
    await row.update({ status: 'failed', error: err.message, retries: row.retries + 1 });
    throw err;
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try { await mq.close(); } catch (e) {}
  process.exit(0);
});

module.exports = mq;
