const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SaleItem = sequelize.define('SaleItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sale_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'sales',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    product_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Snapshot of product name at time of sale'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    unit_cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Snapshot of cost price at time of sale'
    },
    unit_selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Snapshot of selling price at time of sale'
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'sale_items',
    timestamps: true,
    indexes: [
        { fields: ['sale_id'] },
        { fields: ['product_id'] }
    ]
});

// Calculate subtotal before creation
SaleItem.beforeCreate(async(saleItem) => {
    saleItem.subtotal = parseFloat(saleItem.unit_selling_price) * parseInt(saleItem.quantity);
});

module.exports = SaleItem;