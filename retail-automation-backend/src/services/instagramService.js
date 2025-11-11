const axios = require('axios');
const tokenManager = require('./instagramTokenManager');

/**
 * Minimal Instagram publish helper.
 * This is a thin wrapper and placeholder — you must supply valid long-lived
 * access tokens and account ids via store configuration or environment vars.
 */
const publishStockUpdate = async (args) => {
  // Log the full arguments for debugging
  console.log('[Instagram] publishStockUpdate args:', args);
  const { store, product, caption, images = [], video_url = null } = args;
  // If test mode is enabled, just log and return a fake response
  if (process.env.IG_TEST_MODE === 'true') {
    console.log('[IG TEST MODE] publishStockUpdate', { store: store?.id, product: product?.id });
    return { success: true, provider_id: 'test-ig-1' };
  }
  // Use tokenManager to obtain a fresh token (refresh when needed)
  let accessToken = null;
  try {
    accessToken = await tokenManager.getAccessToken();
  } catch (e) {
    // fallback to env/store
    accessToken = process.env.IG_ACCESS_TOKEN || store?.instagram_access_token || null;
  }
  const igUserId = process.env.IG_USER_ID || store?.instagram_account_id || '17841477764075271';
  if (!accessToken || !igUserId) {
    throw new Error('Instagram credentials not configured for this store or in env');
  }
  // Basic flow: create media container (image or video) then publish.
  // For production, handle video/carousel and required image hosting (S3/Cloudinary) and size checks.
  try {
    let containerRes;
    if (video_url) {
      // Always upload as a Reel (REELS)
      const params = {
        video_url,
        caption,
        access_token: accessToken,
        media_type: 'REELS'
      };
      containerRes = await axios.post(`https://graph.facebook.com/v17.0/${igUserId}/media`, null, {
        params
      });
    } else {
      // Image post (default)
      const image_url = images.length ? images[0] : null;
      if (!image_url) throw new Error('No image or video provided for Instagram post');
      containerRes = await axios.post(`https://graph.facebook.com/v17.0/${igUserId}/media`, null, {
        params: {
          image_url,
          caption,
          access_token: accessToken
        }
      });
    }
    const containerId = containerRes.data.id;
    // Poll for media status until it's ready (max 180s, poll every 5s)
    const maxPolls = 36; // 36 x 5s = 180s (3 minutes)
    let status = 'IN_PROGRESS';
    for (let i = 0; i < maxPolls; i++) {
      const statusRes = await axios.get(`https://graph.facebook.com/v17.0/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken
        }
      });
      status = statusRes.data.status_code;
      console.log(`[Instagram] Poll ${i+1}/${maxPolls}: status_code = ${status}`);
      if (status === 'FINISHED') break;
      await new Promise(res => setTimeout(res, 5000));
    }
    if (status !== 'FINISHED') {
      throw new Error(`Instagram media not ready after waiting. Last status: ${status}. Try again later or check your video URL.`);
    }
    // Publish media
    const publishRes = await axios.post(`https://graph.facebook.com/v17.0/${igUserId}/media_publish`, null, {
      params: {
        creation_id: containerId,
        access_token: accessToken
      }
    });
    return { success: true, provider_id: publishRes.data.id };
  } catch (err) {
    console.error('Instagram publish error', err?.response?.data || err.message || err);
    throw err;
  }
};

module.exports = { publishStockUpdate };
