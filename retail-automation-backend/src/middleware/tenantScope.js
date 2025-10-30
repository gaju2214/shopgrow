// Middleware to automatically scope queries to current store
const tenantScope = (req, res, next) => {
  if (!req.store_id) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required for this resource.'
      }
    });
  }
  
  // Store tenant ID for easy access in controllers
  req.query.store_id = req.store_id;
  
  next();
};

module.exports = tenantScope;
