const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      }
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'instagram, facebook, twitter, etc.'
    },
    long_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'Bearer'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tokens',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['store_id', 'platform']
      }
    ]
  });

  return Token;
};