const SocialToken = require('../models/SocialToken');
const Store = require('../models/Store');
const instagramTokenManager = require('../services/instagramTokenManager');
const { sequelize } = require('../config/database');

/**
 * Save or update social media token for a store
 * POST /api/tokens/save
 */
exports.saveToken = async(req, res) => {
    const transaction = await sequelize.transaction();

    try {
        // Enforce tenant isolation: use authenticated store_id from auth middleware
        const authenticatedStoreId = req.store_id;
        const {
            store_id: bodyStoreId,
            platform,
            long_token,
            short_token,
            token_expiry,
            page_id,
            page_name,
            page_picture_url,
            metadata
        } = req.body;

        // If client passed a different store_id, reject to prevent cross-tenant writes
        if (bodyStoreId && parseInt(bodyStoreId) !== parseInt(authenticatedStoreId)) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                error: {
                    code: 'TENANT_MISMATCH',
                    message: 'store_id in request does not match authenticated tenant'
                }
            });
        }

        const store_id = authenticatedStoreId;

        // Validate required fields
        if (!store_id || !platform || !long_token) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'store_id, platform, and long_token are required'
                }
            });
        }

        // Validate platform
        const validPlatforms = ['instagram', 'facebook', 'whatsapp'];
        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLATFORM',
                    message: `Platform must be one of: ${validPlatforms.join(', ')}`
                }
            });
        }

        // Verify store exists (authenticated)
        const store = await Store.findByPk(store_id, { transaction });
        if (!store) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'STORE_NOT_FOUND',
                    message: 'Store not found'
                }
            });
        }

        // Check if token already exists for this store & platform
        let token = await SocialToken.findOne({
            where: { store_id, platform },
            transaction
        });

        if (token) {
            // Update existing token
            token = await token.update({
                long_token,
                short_token: short_token || token.short_token,
                token_expiry: token_expiry || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
                page_id: page_id || token.page_id,
                page_name: page_name || token.page_name,
                page_picture_url: page_picture_url || token.page_picture_url,
                metadata: metadata || token.metadata,
                refresh_status: 'valid',
                refresh_error: null,
                last_refresh_at: new Date()
            }, { transaction });
        } else {
            // Create new token
            token = await SocialToken.create({
                store_id,
                platform,
                long_token,
                short_token,
                token_expiry: token_expiry || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
                page_id,
                page_name,
                page_picture_url,
                metadata,
                is_active: true,
                refresh_status: 'valid',
                last_refresh_at: new Date()
            }, { transaction });
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Token saved successfully',
            data: {
                id: token.id,
                platform: token.platform,
                page_name: token.page_name,
                page_id: token.page_id,
                token_expiry: token.token_expiry,
                refresh_status: token.refresh_status,
                is_active: token.is_active
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error saving token:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TOKEN_SAVE_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Get all tokens for a store
 * GET /api/tokens/store/:store_id
 */
exports.getStoreTokens = async(req, res) => {
    try {
        const { store_id } = req.params;

        // Ensure requester only accesses their own store tokens
        if (parseInt(store_id) !== parseInt(req.store_id)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied for requested store'
                }
            });
        }

        const tokens = await SocialToken.findAll({
            where: { store_id: req.store_id, is_active: true },
            attributes: [
                'id',
                'platform',
                'page_id',
                'page_name',
                'page_picture_url',
                'token_expiry',
                'refresh_status',
                'last_refresh_at',
                'is_active',
                'createdAt'
            ],
            order: [
                ['platform', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            data: tokens
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Get specific token by ID
 * GET /api/tokens/:token_id
 */
exports.getToken = async(req, res) => {
    try {
        const { token_id } = req.params;

        const token = await SocialToken.findByPk(token_id, {
            attributes: [
                'id',
                'store_id',
                'platform',
                'page_id',
                'page_name',
                'page_picture_url',
                'token_expiry',
                'refresh_status',
                'last_refresh_at',
                'is_active',
                'createdAt',
                'metadata'
            ]
        });

        if (!token) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token not found'
                }
            });
        }

        // Enforce tenant isolation
        if (parseInt(token.store_id) !== parseInt(req.store_id)) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied for this token' } });
        }

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Delete/Disconnect a token
 * DELETE /api/tokens/:token_id
 */
exports.deleteToken = async(req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { token_id } = req.params;

        const token = await SocialToken.findByPk(token_id, { transaction });
        if (!token) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token not found'
                }
            });
        }

        // Enforce tenant isolation
        if (parseInt(token.store_id) !== parseInt(req.store_id)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete token for another store' } });
        }

        const platform = token.platform;
        const page_name = token.page_name;

        await token.destroy({ transaction });
        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `${platform} account (${page_name}) disconnected successfully`
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting token:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Get token status for frontend display
 * GET /api/tokens/:token_id/status
 */
exports.getTokenStatus = async(req, res) => {
    try {
        const { token_id } = req.params;

        const token = await SocialToken.findByPk(token_id, {
            attributes: [
                'id',
                'platform',
                'page_name',
                'page_picture_url',
                'token_expiry',
                'refresh_status',
                'last_refresh_at',
                'is_active'
            ]
        });

        if (!token) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token not found'
                }
            });
        }

        // Enforce tenant isolation
        if (parseInt(token.store_id) !== parseInt(req.store_id)) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied for this token' } });
        }

        // Calculate days until expiry
        const now = new Date();
        const expiryDate = new Date(token.token_expiry);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        res.status(200).json({
            success: true,
            data: {
                id: token.id,
                platform: token.platform,
                page_name: token.page_name,
                page_picture_url: token.page_picture_url,
                status: token.refresh_status,
                is_active: token.is_active,
                token_expiry: token.token_expiry,
                days_until_expiry: daysUntilExpiry,
                last_refresh_at: token.last_refresh_at,
                needs_attention: daysUntilExpiry < 7 || token.refresh_status !== 'valid'
            }
        });
    } catch (error) {
        console.error('Error fetching token status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'STATUS_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Get token by platform for a store
 * GET /api/tokens/store/:store_id/platform/:platform
 */
exports.getTokenByPlatform = async(req, res) => {
    try {
        const { store_id, platform } = req.params;

        // Ensure requester only accesses their own store tokens
        if (parseInt(store_id) !== parseInt(req.store_id)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied for requested store'
                }
            });
        }

        const token = await SocialToken.findOne({
            where: { store_id: req.store_id, platform, is_active: true }
        });

        if (!token) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: `No active ${platform} token found for this store`
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: token.id,
                platform: token.platform,
                page_id: token.page_id,
                page_name: token.page_name,
                token_expiry: token.token_expiry,
                refresh_status: token.refresh_status
            }
        });
    } catch (error) {
        console.error('Error fetching token by platform:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: error.message
            }
        });
    }
};

/**
 * Manually refresh a specific token (optional - for emergency)
 * POST /api/tokens/:token_id/refresh
 */
exports.refreshToken = async(req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { token_id } = req.params;

        const token = await SocialToken.findByPk(token_id, { transaction });
        if (!token) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_FOUND',
                    message: 'Token not found'
                }
            });
        }

        // Enforce tenant isolation
        if (parseInt(token.store_id) !== parseInt(req.store_id)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot refresh token for another store' } });
        }

        // Only Instagram tokens can be refreshed (for now)
        if (token.platform !== 'instagram') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'UNSUPPORTED_REFRESH',
                    message: `Token refresh not supported for ${token.platform} platform`
                }
            });
        }

        // Update status to refreshing
        await token.update({ refresh_status: 'refreshing' }, { transaction });

        try {
            // Attempt to refresh the token
            const newToken = await instagramTokenManager.refreshLongToken(token.long_token);

            // Update with new token
            await token.update({
                long_token: newToken.access_token,
                token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                refresh_status: 'valid',
                refresh_error: null,
                last_refresh_at: new Date()
            }, { transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    id: token.id,
                    refresh_status: 'valid',
                    token_expiry: token.token_expiry
                }
            });
        } catch (refreshError) {
            // Mark as failed
            await token.update({
                refresh_status: 'failed',
                refresh_error: refreshError.message
            }, { transaction });

            await transaction.commit();

            res.status(400).json({
                success: false,
                error: {
                    code: 'REFRESH_FAILED',
                    message: 'Token refresh failed: ' + refreshError.message
                }
            });
        }
    } catch (error) {
        await transaction.rollback();
        console.error('Error refreshing token:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REFRESH_ERROR',
                message: error.message
            }
        });
    }
};