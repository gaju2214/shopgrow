/**
 * Small bootstrapper that starts the Instagram token auto-refresh background job.
 * Required at app startup in `src/app.js`.
 */
try {
  const tokenManager = require('./services/instagramTokenManager');
  // start with default 24h interval (can be overridden via env MS if needed)
  const intervalMs = process.env.IG_TOKEN_REFRESH_INTERVAL_MS ? parseInt(process.env.IG_TOKEN_REFRESH_INTERVAL_MS, 10) : undefined;
  tokenManager.startAutoRefresh(intervalMs);
  console.log('[autoRefreshInstagramToken] Started Instagram token auto-refresh');
} catch (e) {
  console.error('[autoRefreshInstagramToken] Failed to start token auto-refresh', e?.message || e);
}
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { refreshInstagramToken, TOKEN_PATH } = require('./services/instagramTokenService');

// Load current token from environment or file
function getCurrentToken() {
  if (process.env.IG_ACCESS_TOKEN) return process.env.IG_ACCESS_TOKEN;
  if (fs.existsSync(TOKEN_PATH)) {
    const data = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    return data.access_token;
  }
  return null;
}

// Schedule token refresh every 50 days (token expires in 60 days)
cron.schedule('0 0 */50 * *', async () => {
  const currentToken = getCurrentToken();
  if (!currentToken) {
    console.error('[Instagram] No access token found for refresh.');
    return;
  }
  try {
    await refreshInstagramToken(currentToken);
  } catch (err) {
    // Error already logged in refreshInstagramToken
  }
});

console.log('[Instagram] Token auto-refresh scheduler started.');
