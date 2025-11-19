const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketingQueue = sequelize.define('MarketingQueue', {
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
  type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g., stock_update, promotional_post'
  },
  payload: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Arbitrary payload for the job (product id, template params, etc)'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed'),
    defaultValue: 'pending'
  },
  requires_approval: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  send_whatsapp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  send_instagram: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  retries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'marketing_queue',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['status'] }
  ]
});

module.exports = MarketingQueue;
