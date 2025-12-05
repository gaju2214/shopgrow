const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocialToken = sequelize.define('SocialToken', {
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
    },
    onDelete: 'CASCADE'
  },
  platform: {
    type: DataTypes.ENUM('instagram', 'facebook', 'whatsapp'),
    allowNull: false
  },
  long_token: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Long-lived access token'
  },
  short_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Short-lived access token (if applicable)'
  },
  token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Token expiration date'
  },
  page_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Instagram/Facebook page ID'
  },
  page_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Page/Account name'
  },
  page_picture_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  refresh_status: {
    type: DataTypes.ENUM('valid', 'expired', 'refreshing', 'failed'),
    defaultValue: 'valid'
  },
  last_refresh_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last successful token refresh timestamp'
  },
  refresh_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message from last failed refresh attempt'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional platform-specific data'
  }
}, {
  tableName: 'social_tokens',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['platform'] },
    { fields: ['store_id', 'platform'], unique: true },
    { fields: ['is_active'] },
    { fields: ['refresh_status'] },
    { fields: ['token_expiry'] }
  ]
});

module.exports = SocialToken;
