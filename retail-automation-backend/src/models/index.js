const Store = require('./Store');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');

// Store associations
Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories' });
Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
Store.hasMany(Customer, { foreignKey: 'store_id', as: 'customers' });
Store.hasMany(Sale, { foreignKey: 'store_id', as: 'sales' });

// Category associations
Category.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Category.belongsTo(Category, { foreignKey: 'parent_category_id', as: 'parentCategory' });
Category.hasMany(Category, { foreignKey: 'parent_category_id', as: 'subCategories' });

// Product associations
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(SaleItem, { foreignKey: 'product_id', as: 'saleItems' });

// Customer associations
Customer.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });

// Sale associations
Sale.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });

// SaleItem associations
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  Store,
  Category,
  Product,
  Customer,
  Sale,
  SaleItem
};
