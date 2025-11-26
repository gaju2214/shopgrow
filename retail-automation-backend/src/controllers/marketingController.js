const axios = require("axios");
const { MarketingQueue } = require('../models');

// Import the marketing worker
let marketingQueueWorker;
try {
    marketingQueueWorker = require('../queue/marketingWorker');
} catch (e) {
    console.error('Marketing worker not found, queue operations will be skipped');
    marketingQueueWorker = {
        add: async() => {
            console.warn('Marketing worker not configured');
        }
    };
}

// Create a new marketing queue entry
exports.createQueueEntry = async(req, res, next) => {
    try {
        const store_id = req.store_id;
        const { type, payload, scheduled_at, requires_approval, send_whatsapp, send_instagram } = req.body;

        // Validation
        if (!type || !payload) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'type and payload are required'
                }
            });
        }

        const requiresApproval = requires_approval !== undefined ? requires_approval : true;

        // Create the queue entry
        const entry = await MarketingQueue.create({
            store_id,
            type,
            payload,
            scheduled_at: scheduled_at || null,
            requires_approval: requiresApproval,
            send_whatsapp: !!send_whatsapp,
            send_instagram: !!send_instagram,
            status: requiresApproval ? 'pending_approval' : 'pending'
        });

        // If no approval needed, add to queue immediately
        if (!requiresApproval) {
            try {
                await marketingQueueWorker.add({ mqId: entry.id });
                console.log(`Queue entry ${entry.id} added to worker`);
            } catch (e) {
                console.error('Failed to queue item:', e?.message || e);
            }
        }

        res.status(201).json({
            success: true,
            data: {
                id: entry.id,
                status: entry.status
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get all pending items (awaiting approval)
exports.getPending = async(req, res, next) => {
    try {
        const items = await MarketingQueue.findAll({
            where: {
                store_id: req.store_id,
                status: 'pending_approval'
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            data: { items }
        });
    } catch (err) {
        next(err);
    }
};

// Get all queue items (optional - for viewing all statuses)
exports.getAll = async(req, res, next) => {
    try {
        const { status } = req.query;
        const whereClause = { store_id: req.store_id };

        if (status) {
            whereClause.status = status;
        }

        const items = await MarketingQueue.findAll({
            where: whereClause,
            order: [
                ['createdAt', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            data: { items }
        });
    } catch (err) {
        next(err);
    }
};

// Approve a queue item
exports.approve = async(req, res, next) => {
    try {
        const item = await MarketingQueue.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Queue item not found'
            });
        }

        // Check if already processed
        if (item.status === 'approved' || item.status === 'processing' || item.status === 'completed') {
            return res.status(200).json({
                success: true,
                message: `Item already ${item.status}`
            });
        }

        // Check if item needs approval
        if (item.status !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Item does not require approval'
            });
        }

        // Update to approved status
        await item.update({
            status: 'approved',
            requires_approval: false,
            approved_by: req.store_id,
            approved_at: new Date(),
        });

        // Add to queue for processing
        try {
            await marketingQueueWorker.add({ mqId: item.id });
            console.log(`Queue entry ${item.id} approved and added to worker`);
        } catch (e) {
            console.error('Failed to queue after approval:', e?.message || e);
            // Revert status if queueing fails
            await item.update({ status: 'pending_approval' });
            return res.status(500).json({
                success: false,
                message: 'Failed to queue item for processing'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Approved and queued for processing',
            data: {
                id: item.id,
                status: 'approved'
            }
        });
    } catch (err) {
        next(err);
    }
};

// Reject a queue item (optional)
exports.reject = async(req, res, next) => {
    try {
        const { reason } = req.body;
        const item = await MarketingQueue.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Queue item not found'
            });
        }

        if (item.status !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Item is not pending approval'
            });
        }

        await item.update({
            status: 'rejected',
            rejected_by: req.store_id,
            rejected_at: new Date(),
            rejection_reason: reason || null
        });

        return res.status(200).json({
            success: true,
            message: 'Queue item rejected',
            data: {
                id: item.id,
                status: 'rejected'
            }
        });
    } catch (err) {
        next(err);
    }
};

// Delete a queue item
exports.deleteQueueEntry = async(req, res, next) => {
    try {
        const item = await MarketingQueue.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Queue item not found'
            });
        }

        // Prevent deletion of processing items
        if (item.status === 'processing') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete item currently being processed'
            });
        }

        await item.destroy();

        return res.status(200).json({
            success: true,
            message: 'Queue item deleted'
        });
    } catch (err) {
        next(err);
    }
};

// Instagram Reel posting controller
exports.testInstagram = async(req, res) => {
    const { caption, video_url } = req.body;

    // Validation
    if (!video_url) {
        return res.status(400).json({
            success: false,
            error: 'video_url is required'
        });
    }

    const igUserId = process.env.IG_USER_ID || "122095765137114152";
    let accessToken = process.env.IG_ACCESS_TOKEN;

    // Try to read access token from file
    try {
        const fs = require('fs');
        const path = require('path');
        const tokenPath = path.join(__dirname, '../../instagram_token.json');
        if (fs.existsSync(tokenPath)) {
            const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
            accessToken = data.access_token;
            console.log('[Instagram] Using token from file');
        }
    } catch (err) {
        console.error('Token file read error:', err.message);
    }

    // Check if token exists
    if (!accessToken) {
        return res.status(500).json({
            success: false,
            error: 'Instagram access token not configured'
        });
    }

    try {
        // Step 1: Create media container
        const createContainerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
        const params = {
            media_type: "REELS",
            video_url,
            caption: caption || '',
            access_token: accessToken,
            share_to_feed: true,
        };

        console.log('[Instagram] Creating container with params:', {
            ...params,
            access_token: '***'
        });

        const containerResponse = await axios.post(createContainerUrl, null, {
            params,
            timeout: 30000 // 30 second timeout
        });
        const containerId = containerResponse.data.id;

        console.log("✅ Container created:", containerId);

        // Step 2: Publish the media
        const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
        const publishResponse = await axios.post(publishUrl, null, {
            params: {
                creation_id: containerId,
                access_token: accessToken,
            },
            timeout: 30000
        });

        console.log("✅ Reel published:", publishResponse.data);

        res.json({
            success: true,
            message: "Reel published successfully",
            data: {
                mediaId: publishResponse.data.id,
                containerId,
                permalink: `https://www.instagram.com/p/${publishResponse.data.id}/`
            }
        });
    } catch (error) {
    console.error("Instagram publish error:", error.response?.data || error.message);

        const errorResponse = {
            success: false,
            error: error.response?.data || {
                message: error.message,
                type: 'request_error'
            },
        };

        // Add helpful error messages
        if (error.response?.data?.error?.message) {
            errorResponse.errorMessage = error.response.data.error.message;
        }

        res.status(error.response?.status || 500).json(errorResponse);
    }
};

// Post to Instagram as part of queue processing (to be called by worker)
exports.publishToInstagram = async(queueItem) => {
    const { caption, video_url } = queueItem.payload;

    if (!video_url) {
        throw new Error('video_url is required in payload');
    }

    const igUserId = process.env.IG_USER_ID;
    let accessToken = process.env.IG_ACCESS_TOKEN;

    // Try to read access token from file
    try {
        const fs = require('fs');
        const path = require('path');
        const tokenPath = path.join(__dirname, '../../instagram_token.json');
        if (fs.existsSync(tokenPath)) {
            const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
            accessToken = data.access_token;
        }
    } catch (err) {
        console.error('Token file read error:', err.message);
    }

    if (!accessToken || !igUserId) {
        throw new Error('Instagram credentials not configured');
    }

    // Step 1: Create container
    const createContainerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    const containerResponse = await axios.post(createContainerUrl, null, {
        params: {
            media_type: "REELS",
            video_url,
            caption: caption || '',
            access_token: accessToken,
            share_to_feed: true,
        },
        timeout: 30000
    });

    const containerId = containerResponse.data.id;
    console.log("✅ Container created:", containerId);

    // Step 2: Publish
    const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, null, {
        params: {
            creation_id: containerId,
            access_token: accessToken,
        },
        timeout: 30000
    });

    console.log("✅ Reel published:", publishResponse.data);

    return {
        mediaId: publishResponse.data.id,
        containerId
    };
};

module.exports = exports;