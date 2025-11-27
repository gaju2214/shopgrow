const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File size exceeds the limit of 50MB',
                },
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'TOO_MANY_FILES',
                    message: 'Too many files uploaded',
                },
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'UNEXPECTED_FILE',
                    message: 'Unexpected file field',
                },
            });
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'FILE_UPLOAD_ERROR',
                message: err.message || 'File upload failed',
            },
        });
    }

    // Custom file validation errors (from fileFilter)
    if (err.message && err.message.includes('file')) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_FILE',
                message: err.message,
            },
        });
    }

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: err.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            }
        });
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Record already exists',
                details: err.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            }
        });
    }

    // Sequelize database connection errors
    if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            success: false,
            error: {
                code: 'DATABASE_CONNECTION_ERROR',
                message: 'Database connection failed',
            }
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token',
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Authentication token has expired',
            }
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'SERVER_ERROR',
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;