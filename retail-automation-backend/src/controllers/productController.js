const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const validators = require('../utils/validators');

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validators.productCreation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    // Add store_id from authenticated user
    value.store_id = req.store_id;

    // Check if category exists (if provided)
    if (value.category_id) {
      const category = await Category.findOne({
        where: {
          id: value.category_id,
          store_id: req.store_id
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found'
          }
        });
      }
    }

    // Check if SKU already exists for this store
    if (value.sku) {
      const existingProduct = await Product.findOne({
        where: {
          store_id: req.store_id,
          sku: value.sku
        }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SKU_EXISTS',
            message: 'Product with this SKU already exists'
          }
        });
      }
    }

    // Create product
    const product = await Product.create(value);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    next(error);
  }
};

// Get all products with pagination and filtering
exports.getAllProducts = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filtering parameters
    const { search, category_id, min_price, max_price, low_stock, is_active } = req.query;

    // Build where clause
    const where = { store_id: req.store_id };

    // Search by name or SKU
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by category
    if (category_id) {
      where.category_id = category_id;
    }

    // Filter by price range
    if (min_price) {
      where.selling_price = { [Op.gte]: parseFloat(min_price) };
    }
    if (max_price) {
      where.selling_price = { 
        ...where.selling_price,
        [Op.lte]: parseFloat(max_price) 
      };
    }

    // Filter by low stock
    if (low_stock === 'true') {
      where[Op.and] = [
        { stock_quantity: { [Op.lte]: Product.sequelize.col('low_stock_threshold') } }
      ];
    }

    // Filter by active status
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Fetch products with count
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: { products },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get single product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        store_id: req.store_id
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    // Add computed fields
    const productData = product.toJSON();
    productData.profit_margin = product.getProfitMargin();
    productData.is_low_stock = product.isLowStock();

    res.status(200).json({
      success: true,
      data: { product: productData }
    });

  } catch (error) {
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validators.productCreation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    // Find product
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        store_id: req.store_id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    // Check if category exists (if provided and changed)
    if (value.category_id && value.category_id !== product.category_id) {
      const category = await Category.findOne({
        where: {
          id: value.category_id,
          store_id: req.store_id
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found'
          }
        });
      }
    }

    // Check if SKU already exists (if changed)
    if (value.sku && value.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        where: {
          store_id: req.store_id,
          sku: value.sku,
          id: { [Op.ne]: product.id }
        }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SKU_EXISTS',
            message: 'Product with this SKU already exists'
          }
        });
      }
    }

    // Update product
    await product.update(value);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });

  } catch (error) {
    next(error);
  }
};

// Delete product (soft delete by setting is_active to false)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        store_id: req.store_id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    // Soft delete
    await product.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Update stock quantity
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quantity and operation (add/subtract/set) are required'
        }
      });
    }

    const product = await Product.findOne({
      where: {
        id: req.params.id,
        store_id: req.store_id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        }
      });
    }

    let newQuantity = product.stock_quantity;

    switch (operation) {
      case 'add':
        newQuantity += parseInt(quantity);
        break;
      case 'subtract':
        newQuantity -= parseInt(quantity);
        if (newQuantity < 0) newQuantity = 0;
        break;
      case 'set':
        newQuantity = parseInt(quantity);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Operation must be add, subtract, or set'
          }
        });
    }

    await product.update({ stock_quantity: newQuantity });

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product: {
          id: product.id,
          name: product.name,
          stock_quantity: product.stock_quantity,
          is_low_stock: product.isLowStock()
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: {
        store_id: req.store_id,
        is_active: true,
        [Op.and]: [
          { stock_quantity: { [Op.lte]: Product.sequelize.col('low_stock_threshold') } }
        ]
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['stock_quantity', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });

  } catch (error) {
    next(error);
  }
};
