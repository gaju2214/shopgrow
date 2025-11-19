const fs = require('fs');
const path = require('path');
const axios = require('axios');

const tokenPath = path.join(__dirname, '../../instagram_token.json');

const IG_APP_ID = process.env.IG_APP_ID;
const IG_APP_SECRET = process.env.IG_APP_SECRET;

const readTokenFile = () => {
  try {
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
      return data;
    }
  } catch (e) {
    console.error('[InstagramTokenManager] Failed to read token file', e?.message || e);
  }
  return null;
};

const writeTokenFile = (data) => {
  try {
    fs.writeFileSync(tokenPath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('[InstagramTokenManager] Failed to write token file', e?.message || e);
    return false;
  }
};

/**
 * Refresh a long-lived token using Meta's OAuth endpoint.
 * Returns { access_token, expires_in }
 */
const refreshLongLivedToken = async (currentToken) => {
  if (!IG_APP_ID || !IG_APP_SECRET) {
    throw new Error('IG_APP_ID or IG_APP_SECRET not configured in env');
  }
  const url = `https://graph.facebook.com/v17.0/oauth/access_token`;
  const params = {
    grant_type: 'fb_exchange_token',
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    fb_exchange_token: currentToken
  };
  const res = await axios.get(url, { params });
  return res.data; // { access_token, token_type, expires_in }
};

/**
 * Ensures we have a fresh access token. If token is near expiry (<= 5 days), refresh it.
 * Returns the access_token string.
 */
const getAccessToken = async () => {
  // 1) prefer token file
  const file = readTokenFile();
  if (file && file.access_token) {
    // If we have expires_at, check
    if (file.expires_at) {
      const expiresAt = new Date(file.expires_at);
      const now = new Date();
      const msLeft = expiresAt - now;
      const daysLeft = msLeft / (1000 * 60 * 60 * 24);
      if (daysLeft > 5) {
        return file.access_token;
      }
      // otherwise attempt refresh
      try {
        const refreshed = await refreshLongLivedToken(file.access_token);
        const newExpiry = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null;
        const out = {
          access_token: refreshed.access_token || file.access_token,
          refreshed_at: new Date().toISOString(),
          expires_at: newExpiry
        };
        writeTokenFile(out);
        return out.access_token;
      } catch (e) {
        console.error('[InstagramTokenManager] Refresh failed', e?.response?.data || e?.message || e);
        // fallback to existing token if refresh fails
        return file.access_token;
      }
    }
    // no expiry info: just return token
    return file.access_token;
  }

  // 2) fallback to env var
  if (process.env.IG_ACCESS_TOKEN) return process.env.IG_ACCESS_TOKEN;

  throw new Error('No Instagram access token available');
};

/**
 * Force refresh token now. Useful for scheduled refresh.
 */
const forceRefresh = async () => {
  const file = readTokenFile();
  if (!file || !file.access_token) throw new Error('No existing token to refresh');
  const refreshed = await refreshLongLivedToken(file.access_token);
  const newExpiry = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString() : null;
  const out = {
    access_token: refreshed.access_token || file.access_token,
    refreshed_at: new Date().toISOString(),
    expires_at: newExpiry
  };
  writeTokenFile(out);
  return out;
};

/**
 * Start a background interval that refreshes token once per day (if present).
 */
const startAutoRefresh = (intervalMs = 1000 * 60 * 60 * 24) => {
  // run immediately then every interval
  (async () => {
    try {
      const file = readTokenFile();
      if (file && file.access_token) {
        await getAccessToken();
      }
    } catch (e) {
      console.error('[InstagramTokenManager] Startup refresh error', e?.message || e);
    }
  })();

  setInterval(async () => {
    try {
      const file = readTokenFile();
      if (file && file.access_token) {
        await forceRefresh();
        console.log('[InstagramTokenManager] Token refreshed (scheduled)');
      }
    } catch (e) {
      console.error('[InstagramTokenManager] Scheduled refresh failed', e?.response?.data || e?.message || e);
    }
  }, intervalMs);
};

module.exports = { getAccessToken, forceRefresh, startAutoRefresh };
