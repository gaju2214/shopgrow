const jwt = require('jsonwebtoken');
const { Store } = require('../models');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
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
