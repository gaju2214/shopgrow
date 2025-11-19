const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  mobile_number: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  anniversary_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preferred_categories: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of category IDs'
  },
  whatsapp_opt_in: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  whatsapp_opt_in_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_purchases: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_purchase_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['mobile_number'] },
    { fields: ['email'] },
    { unique: true, fields: ['store_id', 'mobile_number'] }
  ]
});

module.exports = Customer;
