const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    store_name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    store_logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    store_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    store_city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    store_category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g., Grocery, Fashion, Electronics'
    },
    gstn: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
        validate: {
            is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i
        }
    },
    mobile_number: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    subscription_tier: {
        type: DataTypes.ENUM('free', 'basic', 'premium'),
        defaultValue: 'free'
    }
}, {
    tableName: 'stores',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['gstn'] },
        { fields: ['is_active'] }
    ]
});

// Hash password before creating store
Store.beforeCreate(async(store) => {
    if (store.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        store.password = await bcrypt.hash(store.password, rounds);
    }
});

// Hash password before updating if changed
Store.beforeUpdate(async(store) => {
    if (store.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        store.password = await bcrypt.hash(store.password, rounds);
    }
});

// Instance method to verify password
Store.prototype.verifyPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON responses
Store.prototype.toJSON = function() {
    const values = {...this.get() };
    delete values.password;
    return values;
};

module.exports = Store;