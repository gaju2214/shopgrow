const jwt = require('jsonwebtoken');
const { Store } = require('../models');

// Generate JWT tokens
const generateTokens = (store) => {
    const accessToken = jwt.sign({
            store_id: store.id,
            email: store.email
        },
        process.env.JWT_SECRET || 'your-secret-key', { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign({
            store_id: store.id
        },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

// Register store
exports.register = async(req, res, next) => {
    try {
        console.log('📥 Registration request body:', req.body);
        console.log('📁 Uploaded file:', req.file);


        // Map frontend fields to backend model fields
        const {
            name,
            email,
            mobile,
            city,
            address,
            category,
            webpage,
            password
        } = req.body;

        // Validate required fields
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Name, email, mobile, and password are required'
                }
            });
        }

        // Check if store already exists
        const existingStore = await Store.findOne({
            where: { email: email }
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

        // Create store using correct model fields
        const store = await Store.create({
            store_name: name,
            store_logo_url: req.file ? `/uploads/logos/${req.file.filename}` : null,
            store_address: address || null,
            store_city: city || null,
            store_category: category || null,
            mobile_number: mobile,
            email: email,
            password: password,
            is_active: true
        });

        console.log('✅ Store created:', store.id);

        res.status(201).json({
            success: true,
            message: 'Store registered successfully',
            data: {
                store: {
                    id: store.id,
                    name: store.store_name,
                    email: store.email
                }
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REGISTRATION_FAILED',
                message: error.message
            }
        });
    }
};

// Login store
exports.login = async(req, res, next) => {
    try {
        console.log('📥 Login request body:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CREDENTIALS',
                    message: 'Email and password are required'
                }
            });
        }

        console.log('🔍 Finding store with email:', email);

        // Find store
        const store = await Store.findOne({
            where: { email: email }
        });

        if (!store) {
            console.log('❌ Store not found');
            return res.status(404).json({
                success: false,
                error: {
                    code: 'STORE_NOT_FOUND',
                    message: 'Store not found. Please register first.'
                }
            });
        }

        console.log('✅ Store found:', store.store_name);

        // Verify password
        const isPasswordValid = await store.verifyPassword(password);

        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

        // Check if store is active
        if (store.is_active === false) {
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

        console.log('✅ Login successful');

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                store: {
                    id: store.id,
                    name: store.store_name,
                    email: store.email,
                    mobile: store.mobile_number, // ✅ Changed from contact_phone
                    city: store.city,
                    category: store.category
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            },
            // For frontend compatibility
            user: {
                name: store.store_name,
                email: store.email
            },
            token: tokens.accessToken
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LOGIN_FAILED',
                message: error.message
            }
        });
    }
};

// Get profile
exports.getProfile = async(req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                store: req.store
            }
        });
    } catch (error) {
        next(error);
    }
};