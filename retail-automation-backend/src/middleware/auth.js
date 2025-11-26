const jwt = require('jsonwebtoken');
const { Store } = require('../models');

const auth = async(req, res, next) => {
    try {
        // Get token from header - Fixed optional chaining
        const authHeader = req.header('Authorization');

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access denied. No token provided.'
                }
            });
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access denied. No token provided.'
                }
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate decoded token structure
        if (!decoded.store_id) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token structure.'
                }
            });
        }

        // Find store
        const store = await Store.findByPk(decoded.store_id);

        if (!store) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token. Store not found.'
                }
            });
        }

        if (!store.is_active) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'STORE_INACTIVE',
                    message: 'Store account is inactive.'
                }
            });
        }

        // Attach store info to request
        req.store_id = store.id;
        req.store = store;

        next();
    } catch (error) {
        // JWT specific errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token.'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired.'
                }
            });
        }

        // NotBeforeError - token used before it's valid
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_ACTIVE',
                    message: 'Token not yet active.'
                }
            });
        }

        // Log unexpected errors for debugging
        console.error('Authentication error:', error);

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error during authentication.'
            }
        });
    }
};

module.exports = auth;