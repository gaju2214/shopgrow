const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

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