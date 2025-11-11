const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Template = sequelize.define('Template', {
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
    type: DataTypes.STRING(150),
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('whatsapp', 'instagram'),
    allowNull: false
  },
  content_template: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Template body with variables like {{product_name}}'
  },
  example_params: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'templates',
  timestamps: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['channel'] }
  ]
});

module.exports = Template;
