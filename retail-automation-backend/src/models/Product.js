const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  image_urls: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of image URLs'
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  selling_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'piece',
    comment: 'e.g., piece, kg, liter, box'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['category_id'] },
    { fields: ['sku'] },
    { fields: ['name'] },
    { unique: true, fields: ['store_id', 'sku'] }
  ]
});

// Virtual field for profit margin
Product.prototype.getProfitMargin = function() {
  const cost = parseFloat(this.cost_price);
  const price = parseFloat(this.selling_price);
  if (cost === 0) return 0;
  return ((price - cost) / cost * 100).toFixed(2);
};

// Check if stock is low
Product.prototype.isLowStock = function() {
  return this.stock_quantity <= this.low_stock_threshold;
};

module.exports = Product;
