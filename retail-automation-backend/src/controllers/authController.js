const jwt = require('jsonwebtoken');
const { Store } = require('../models');
const validators = require('../utils/validators');

// Generate JWT tokens
const generateTokens = (store) => {
    const accessToken = jwt.sign({
            store_id: store.id,
            email: store.email
        },
        process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign({
            store_id: store.id
        },
        process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

// Register store
exports.register = async(req, res, next) => {
    try {
        // Validate input
        const { error, value } = validators.storeRegistration.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        // Check if store already exists
        const existingStore = await Store.findOne({
            where: { email: value.email }
        });

        if (existingStore) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'STORE_EXISTS',
                    message: 'Store with this email already exists'
                }
            });
        }

        // Create store
        const store = await Store.create(value);

        res.status(201).json({
            success: true,
            message: 'Store registered successfully',
            data: {
                store: store.toJSON()
            }
        });

    } catch (error) {
        next(error);
    }
};

// Login store
exports.login = async(req, res, next) => {
    try {
        // Validate input
        const { error, value } = validators.storeLogin.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        // Find store
        const store = await Store.findOne({
            where: { email: value.email }
        });

        if (!store) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Verify password
        const isPasswordValid = await store.verifyPassword(value.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Check if store is active
        if (!store.is_active) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'STORE_INACTIVE',
                    message: 'Store account is inactive'
                }
            });
        }

        // Generate tokens
        const tokens = generateTokens(store);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                store: store.toJSON(),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get profile (protected route)
exports.getProfile = async(req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                store: req.store.toJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};