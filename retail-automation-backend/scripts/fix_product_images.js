// Script to fix old products: set image_urls to valid public URLs if possible
// Usage: node scripts/fix_product_images.js

const { Product } = require('../src/models');
const path = require('path');
const baseUrl = 'http://localhost:5000/uploads/';

async function fixImages() {
    const products = await Product.findAll();
    let updated = 0;
    for (const product of products) {
        if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
            // If image_urls contains base64 or relative path, fix it
            let changed = false;
            const newUrls = product.image_urls.map(url => {
                if (!url.startsWith('http')) {
                    // If it's a filename or relative path, convert to public URL
                    const filename = path.basename(url);
                    changed = true;
                    return baseUrl + filename;
                }
                return url;
            });
            if (changed) {
                product.image_urls = newUrls;
                await product.save();
                updated++;
                console.log(`Fixed product: ${product.name} (${product.id})`);
            }
        }
    }
    console.log(`Done. Updated ${updated} products.`);
}

fixImages().catch(err => {
    console.error('Error fixing product images:', err);
});