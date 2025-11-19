const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
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
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  sale_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  sale_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  profit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'upi', 'online'),
    defaultValue: 'cash'
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sales',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['customer_id'] },
    { fields: ['sale_date'] },
    { fields: ['sale_number'] },
    { unique: true, fields: ['store_id', 'sale_number'] }
  ]
});

// Use beforeValidate hook (runs BEFORE validation)
Sale.beforeValidate((sale) => {
  // Generate sale number if not provided
  if (!sale.sale_number) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    sale.sale_number = `SALE-${timestamp}-${random}`;
  }
  
  // Calculate profit
  if (sale.total_amount && sale.total_cost) {
    sale.profit = parseFloat(sale.total_amount) - parseFloat(sale.total_cost);
  }
});

module.exports = Sale;
