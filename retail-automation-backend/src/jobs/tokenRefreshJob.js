/**
 * Token Refresh Cron Job
 * Runs periodically to refresh tokens and maintain their validity
 */

const { CronJob } = require('cron');
const tokenRefreshService = require('../services/tokenRefreshService');

let tokenRefreshJobInstance = null;
let tokenHealthCheckJobInstance = null;
let tokenDeactivateJobInstance = null;

/**
 * Start the token refresh scheduler
 * Runs every 6 hours (or customize as needed)
 */
exports.startTokenRefreshScheduler = () => {
  console.log('[TokenScheduler] Initializing token refresh scheduler...');

  try {
    // Token Refresh Job - Every 6 hours
    tokenRefreshJobInstance = new CronJob('0 */6 * * *', async () => {
      console.log('[TokenScheduler] Token refresh job triggered at:', new Date().toISOString());
      await tokenRefreshService.refreshExpiredTokens();
    });

    console.log('[TokenScheduler] ✅ Token refresh job scheduled (every 6 hours)');

    // Token Health Check Job - Every 12 hours
    tokenHealthCheckJobInstance = new CronJob('0 */12 * * *', async () => {
      console.log('[TokenScheduler] Token health check triggered at:', new Date().toISOString());
      await tokenRefreshService.checkTokensHealth();
    });

    console.log('[TokenScheduler] ✅ Token health check job scheduled (every 12 hours)');

    // Token Deactivate Job - Daily at 2 AM
    tokenDeactivateJobInstance = new CronJob('0 2 * * *', async () => {
      console.log('[TokenScheduler] Token deactivate job triggered at:', new Date().toISOString());
      await tokenRefreshService.deactivateExpiredTokens();
    });

    console.log('[TokenScheduler] ✅ Token deactivate job scheduled (daily at 2 AM)');

    // Start all jobs
    tokenRefreshJobInstance.start();
    tokenHealthCheckJobInstance.start();
    tokenDeactivateJobInstance.start();

    console.log('[TokenScheduler] ✅ All token scheduler jobs started successfully');
    return true;
  } catch (error) {
    console.error('[TokenScheduler] ❌ Error starting scheduler:', error);
    return false;
  }
};

/**
 * Stop the token refresh scheduler
 */
exports.stopTokenRefreshScheduler = () => {
  console.log('[TokenScheduler] Stopping token refresh scheduler...');

  try {
    if (tokenRefreshJobInstance) {
      tokenRefreshJobInstance.stop();
      console.log('[TokenScheduler] Token refresh job stopped');
    }

    if (tokenHealthCheckJobInstance) {
      tokenHealthCheckJobInstance.stop();
      console.log('[TokenScheduler] Token health check job stopped');
    }

    if (tokenDeactivateJobInstance) {
      tokenDeactivateJobInstance.stop();
      console.log('[TokenScheduler] Token deactivate job stopped');
    }

    console.log('[TokenScheduler] ✅ All token scheduler jobs stopped');
    return true;
  } catch (error) {
    console.error('[TokenScheduler] Error stopping scheduler:', error);
    return false;
  }
};

/**
 * Get scheduler status
 */
exports.getSchedulerStatus = () => {
  return {
    token_refresh_job: {
      running: tokenRefreshJobInstance ? tokenRefreshJobInstance.running : false,
      pattern: '0 */6 * * *', // Every 6 hours
      description: 'Refresh tokens expiring within 7 days'
    },
    token_health_check_job: {
      running: tokenHealthCheckJobInstance ? tokenHealthCheckJobInstance.running : false,
      pattern: '0 */12 * * *', // Every 12 hours
      description: 'Check health of all tokens'
    },
    token_deactivate_job: {
      running: tokenDeactivateJobInstance ? tokenDeactivateJobInstance.running : false,
      pattern: '0 2 * * *', // Daily at 2 AM
      description: 'Deactivate completely expired tokens'
    }
  };
};
