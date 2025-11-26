const { Sale, SaleItem, Product, Customer, Category } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const validators = require('../utils/validators');

// Create sale with automatic customer lookup/creation
exports.createSale = async(req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input
        const { error, value } = validators.saleCreation.validate(req.body);
        if (error) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        const { customer_mobile, customer_name, customer_email, items, payment_method, discount_amount, tax_amount, notes } = value;

        // Customer lookup and auto-creation logic
        let customer = null;
        let isNewCustomer = false;

        if (customer_mobile) {
            // Try to find existing customer by mobile number
            customer = await Customer.findOne({
                where: {
                    store_id: req.store_id,
                    mobile_number: customer_mobile
                },
                transaction
            });

            if (!customer) {
                // Customer doesn't exist - create new one
                // Name is required for new customers
                if (!customer_name) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'CUSTOMER_NAME_REQUIRED',
                            message: 'Customer name is required for new customers'
                        }
                    });
                }

                customer = await Customer.create({
                    store_id: req.store_id,
                    name: customer_name,
                    mobile_number: customer_mobile,
                    email: customer_email || null,
                    whatsapp_opt_in: false
                }, { transaction });

                isNewCustomer = true;
            }
        }

        // Validate all products and check stock availability
        const productIds = items.map(item => item.product_id);
        const products = await Product.findAll({
            where: {
                id: productIds,
                store_id: req.store_id,
                is_active: true
            },
            transaction
        });

        if (products.length !== productIds.length) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PRODUCTS_NOT_FOUND',
                    message: 'One or more products not found or inactive'
                }
            });
        }

        // Create product map for easy lookup
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });

        // Check stock availability for each item
        const stockErrors = [];
        items.forEach(item => {
            const product = productMap[item.product_id];
            if (product.stock_quantity < item.quantity) {
                stockErrors.push({
                    product_id: product.id,
                    product_name: product.name,
                    requested: item.quantity,
                    available: product.stock_quantity
                });
            }
        });

        if (stockErrors.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_STOCK',
                    message: 'Insufficient stock for one or more products',
                    details: stockErrors
                }
            });
        }

        // Calculate totals
        let total_cost = 0;
        let total_amount = 0;
        const saleItemsData = [];

        items.forEach(item => {
            const product = productMap[item.product_id];
            const cost = parseFloat(product.cost_price) * item.quantity;
            const amount = parseFloat(product.selling_price) * item.quantity;

            total_cost += cost;
            total_amount += amount;

            saleItemsData.push({
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                unit_cost_price: product.cost_price,
                unit_selling_price: product.selling_price,
                subtotal: amount
            });
        });

        // Apply discount and tax
        total_amount = total_amount - parseFloat(discount_amount || 0) + parseFloat(tax_amount || 0);
        const profit = total_amount - total_cost;

        // Create sale record
        const sale = await Sale.create({
            store_id: req.store_id,
            customer_id: customer ? customer.id : null,
            total_amount,
            total_cost,
            profit,
            payment_method: payment_method || 'cash',
            discount_amount: discount_amount || 0,
            tax_amount: tax_amount || 0,
            notes: notes || null
        }, { transaction });

        // Create sale items
        await Promise.all(
            saleItemsData.map(itemData =>
                SaleItem.create({
                    sale_id: sale.id,
                    ...itemData
                }, { transaction })
            )
        );

        // Update product stock quantities atomically
        await Promise.all(
            items.map(item =>
                Product.decrement(
                    'stock_quantity', {
                        by: item.quantity,
                        where: {
                            id: item.product_id,
                            store_id: req.store_id
                        },
                        transaction
                    }
                )
            )
        );

        // Update customer aggregates (if customer provided)
        if (customer) {
            await customer.update({
                total_purchases: parseFloat(customer.total_purchases) + total_amount,
                total_orders: customer.total_orders + 1,
                last_purchase_date: new Date()
            }, { transaction });
        }

        // Commit transaction
        await transaction.commit();

        // Fetch complete sale with items
        const completeSale = await Sale.findByPk(sale.id, {
            include: [{
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'mobile_number', 'email', 'total_purchases', 'total_orders']
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'name', 'image_urls']
                    }]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Sale recorded successfully',
            data: {
                sale: completeSale,
                customer_status: isNewCustomer ? 'new' : customer ? 'existing' : 'walk-in'
            }
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

// Get all sales with pagination and filters
exports.getAllSales = async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { start_date, end_date, customer_id, payment_method, min_amount, max_amount } = req.query;

        const where = { store_id: req.store_id };

        // Date range filter
        if (start_date || end_date) {
            where.sale_date = {};
            if (start_date) where.sale_date[Op.gte] = new Date(start_date);
            if (end_date) where.sale_date[Op.lte] = new Date(end_date);
        }

        // Customer filter
        if (customer_id) {
            where.customer_id = customer_id;
        }

        // Payment method filter
        if (payment_method) {
            where.payment_method = payment_method;
        }

        // Amount range filter
        if (min_amount) {
            where.total_amount = {
                [Op.gte]: parseFloat(min_amount) };
        }
        if (max_amount) {
            where.total_amount = {
                ...where.total_amount,
                [Op.lte]: parseFloat(max_amount)
            };
        }

        const { count, rows: sales } = await Sale.findAndCountAll({
            where,
            include: [{
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'mobile_number']
                },
                {
                    model: SaleItem,
                    as: 'items',
                    attributes: ['id', 'product_name', 'quantity', 'unit_selling_price', 'subtotal']
                }
            ],
            limit,
            offset,
            order: [
                ['sale_date', 'DESC']
            ],
            distinct: true
        });

        res.status(200).json({
            success: true,
            data: { sales },
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get single sale by ID
exports.getSaleById = async(req, res, next) => {
    try {
        const sale = await Sale.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            },
            include: [{
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'mobile_number', 'email', 'address']
                },
                {
                    model: SaleItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'name', 'sku', 'image_urls'],
                        include: [{
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'name']
                        }]
                    }]
                }
            ]
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SALE_NOT_FOUND',
                    message: 'Sale not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { sale }
        });

    } catch (error) {
        next(error);
    }
};

// Get sales analytics
exports.getSalesAnalytics = async(req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        const where = { store_id: req.store_id };

        if (start_date || end_date) {
            where.sale_date = {};
            if (start_date) where.sale_date[Op.gte] = new Date(start_date);
            if (end_date) where.sale_date[Op.lte] = new Date(end_date);
        }

        // Get sales summary
        const summary = await Sale.findOne({
            where,
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_sales_count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
                [sequelize.fn('SUM', sequelize.col('total_cost')), 'total_cost'],
                [sequelize.fn('SUM', sequelize.col('profit')), 'total_profit'],
                [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value']
            ],
            raw: true
        });

        // Sales by payment method
        const byPaymentMethod = await Sale.findAll({
            where,
            attributes: [
                'payment_method', [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
            ],
            group: ['payment_method'],
            raw: true
        });

        // Top selling products
        const topProducts = await SaleItem.findAll({
            attributes: [
                'product_id',
                'product_name', [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
                [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_revenue']
            ],
            include: [{
                model: Sale,
                as: 'sale',
                where: { store_id: req.store_id, ...where },
                attributes: []
            }],
            group: ['product_id', 'product_name'],
            order: [
                [sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']
            ],
            limit: 10,
            raw: true
        });

        // Top customers
        const topCustomers = await Sale.findAll({
            where: {
                ...where,
                customer_id: {
                    [Op.ne]: null }
            },
            attributes: [
                'customer_id', [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'order_count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_spent']
            ],
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['name', 'mobile_number']
            }],
            group: ['customer_id', 'customer.id'],
            order: [
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']
            ],
            limit: 10
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    total_sales: parseInt(summary.total_sales_count) || 0,
                    total_revenue: parseFloat(summary.total_revenue) || 0,
                    total_cost: parseFloat(summary.total_cost) || 0,
                    total_profit: parseFloat(summary.total_profit) || 0,
                    average_order_value: parseFloat(summary.average_order_value) || 0
                },
                by_payment_method: byPaymentMethod,
                top_products: topProducts,
                top_customers: topCustomers
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get daily/weekly/monthly sales report
exports.getSalesReport = async(req, res, next) => {
    try {
        const { period = 'daily', start_date, end_date } = req.query;

        const where = { store_id: req.store_id };

        if (start_date || end_date) {
            where.sale_date = {};
            if (start_date) where.sale_date[Op.gte] = new Date(start_date);
            if (end_date) where.sale_date[Op.lte] = new Date(end_date);
        }

        let dateFormat;
        switch (period) {
            case 'monthly':
                dateFormat = '%Y-%m';
                break;
            case 'weekly':
                dateFormat = '%Y-%W';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const report = await Sale.findAll({
            where,
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat), 'period'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'sales_count'],
                [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
                [sequelize.fn('SUM', sequelize.col('profit')), 'profit']
            ],
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat)],
            order: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('sale_date'), dateFormat), 'DESC']
            ],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                period,
                report
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = exports;