const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path to store refreshed token (customize as needed)
const TOKEN_PATH = path.join(__dirname, '../../instagram_token.json');

/**
 * Refresh Instagram Long-Lived Access Token
 * @param {string} currentToken - The current long-lived access token
 * @returns {Promise<string>} - The new refreshed token
 */
async function refreshInstagramToken(currentToken) {
  try {
    const url = `https://graph.instagram.com/refresh_access_token`;
    const params = {
      grant_type: 'ig_refresh_token',
      access_token: currentToken
    };
    const res = await axios.get(url, { params });
    const newToken = res.data.access_token;
    // Save the new token for future use (customize as needed)
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ access_token: newToken, expires_in: res.data.expires_in, refreshed_at: new Date() }, null, 2));
    console.log('[Instagram] Token refreshed successfully.');
    return newToken;
  } catch (err) {
    console.error('[Instagram] Token refresh failed:', err?.response?.data || err.message || err);
    throw err;
  }
}

module.exports = { refreshInstagramToken, TOKEN_PATH };
