const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnalyticsSummary = sequelize.define('AnalyticsSummary', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  total_sales: {
    type: DataTypes.DECIMAL(14,2),
    defaultValue: 0
  },
  total_profit: {
    type: DataTypes.DECIMAL(14,2),
    defaultValue: 0
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  top_product: {
    type: DataTypes.UUID,
    allowNull: true
  },
  slow_product: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'analytics_summary',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['date'] }
  ]
});

module.exports = AnalyticsSummary;
