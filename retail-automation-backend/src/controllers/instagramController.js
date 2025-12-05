const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

exports.postProducts = async(req, res) => {
    try {
        const { store_id, products, caption } = req.body;

        // Verify user owns this store
        if (req.user.store_id !== parseInt(store_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Products are required'
            });
        }

        // Fetch Instagram token from SocialToken table
        const SocialToken = require('../models/SocialToken');
        const tokenRow = await SocialToken.findOne({
            where: { store_id, platform: 'instagram', is_active: true }
        });
        if (!tokenRow || !tokenRow.long_token) {
            return res.status(400).json({ success: false, message: 'Instagram token not found for this store' });
        }
        const instagram_token = tokenRow.long_token;

        // Get Instagram user ID (you need to get this from Instagram Graph API)
        const userResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${instagram_token}`);
        const instagramUserId = userResponse.data.id;

        // For simplicity, we'll post the first product's image
        // In production, you might want to create a carousel post with multiple images
        const product = products[0];
        const imagePath = path.join(__dirname, '../uploads', product.image);

        // Check if image exists
        if (!fs.existsSync(imagePath)) {
            return res.status(400).json({
                success: false,
                message: 'Product image not found'
            });
        }

        // Step 1: Create media container
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${product.image}`;

        const containerResponse = await axios.post(
            `https://graph.instagram.com/v12.0/${instagramUserId}/media`, {
                image_url: imageUrl,
                caption: caption || `Check out ${product.name}!`,
                access_token: instagram_token
            }
        );

        const creationId = containerResponse.data.id;

        // Step 2: Publish the media
        const publishResponse = await axios.post(
            `https://graph.instagram.com/v12.0/${instagramUserId}/media_publish`, {
                creation_id: creationId,
                access_token: instagram_token
            }
        );

        res.json({
            success: true,
            message: 'Posted to Instagram successfully',
            media_id: publishResponse.data.id
        });

    } catch (error) {
        // Fix optional chaining syntax
        console.error('Instagram post error:', error.response ? .data || error);

        let errorMessage = 'Failed to post to Instagram';
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage = error.response.data.error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: (error.response && error.response.data) ? error.response.data : error.message
        });
    }
};