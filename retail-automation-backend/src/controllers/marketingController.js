// Create a new marketing queue entry
exports.createQueueEntry = async (req, res, next) => {
  try {
    const store_id = req.store_id;
    const { type, payload, scheduled_at, requires_approval, send_whatsapp, send_instagram } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'type and payload are required' } });
    }
    const entry = await MarketingQueue.create({
      store_id,
      type,
      payload,
      scheduled_at: scheduled_at || null,
      requires_approval: requires_approval !== undefined ? requires_approval : true,
      send_whatsapp: !!send_whatsapp,
      send_instagram: !!send_instagram
    });
    res.status(201).json({ success: true, data: { id: entry.id } });
  } catch (err) {
    next(err);
  }
};
// Clean Instagram Reel posting controller
const axios = require("axios");
exports.testInstagram = async (req, res) => {
  const { caption, video_url } = req.body;
  // Replace with your Instagram Business Account ID
  const igUserId = process.env.IG_USER_ID || "122095765137114152";
  // Use the latest token from file or env
  let accessToken = process.env.IG_ACCESS_TOKEN;
  try {
    const fs = require('fs');
    const path = require('path');
    const tokenPath = path.join(__dirname, '../../instagram_token.json');
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
      accessToken = data.access_token;
    }
  } catch {}
  try {
    // Step 1: Create container
    const createContainerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    const params = {
      media_type: "REELS",
      video_url,
      caption,
      access_token: accessToken,
      share_to_feed: true,
    };
    console.log('[Instagram] Creating container with params:', params);
    const containerResponse = await axios.post(createContainerUrl, null, { params });
    const containerId = containerResponse.data.id;
    console.log("✅ Container created:", containerId, 'Full response:', containerResponse.data);
    // Step 2: Publish it
    const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const publishResponse = await axios.post(publishUrl, null, {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    });
    console.log("✅ Reel published:", publishResponse.data);
    // Add a note if the video is not vertical (9:16)
    let note = undefined;
    if (req.body.video_url && req.body.video_url.includes('samplelib.com/mp4/sample-5s.mp4')) {
      note = 'This sample video is landscape (16:9), so Instagram may not show it in the Reels tab. Use a vertical (9:16) video for public Reels.';
    }
    res.json({
      success: true,
      message: "Reel published successfully",
      data: publishResponse.data,
      containerId,
      note,
      containerResponse: containerResponse.data,
      publishResponse: publishResponse.data
    });
  } catch (error) {
    console.error("Instagram publish error:", error.response?.data || error);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};
const { MarketingQueue } = require('../models');
let marketingQueueWorker;
try {
  marketingQueueWorker = require('../queue/marketingWorker');
} catch (e) {
  marketingQueueWorker = { add: async () => {} };
}

exports.getPending = async (req, res, next) => {
  try {
    const items = await MarketingQueue.findAll({
      where: { store_id: req.store_id, status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const item = await MarketingQueue.findOne({ where: { id: req.params.id, store_id: req.store_id } });
    if (!item)
      return res.status(404).json({ success: false, message: 'Queue item not found' });

    // Check current status instead of 'approved' field
    if (item.status === 'approved')
      return res.status(200).json({ success: true, message: 'Already approved' });

    // Update approval status (set status to 'pending' so worker can pick it up)
    await item.update({
      status: 'pending',
      requires_approval: false,
      approved_by: req.store_id,
      approved_at: new Date(),
    });

    // Add to queue
    try {
      await marketingQueueWorker.add({ mqId: item.id });
    } catch (e) {
      console.error('Failed to queue after approval', e?.message || e);
    }

    return res.status(200).json({ success: true, message: 'Approved' });
  } catch (err) {
    next(err);
  }
};
