// ...existing code...
// Only export controller functions below
const { Customer, Sale, SaleItem } = require('../models');
const { Op } = require('sequelize');
const validators = require('../utils/validators');

// Create customer
exports.createCustomer = async(req, res, next) => {
    try {
        const { error, value } = validators.customerCreation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        value.store_id = req.store_id;

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
            where: {
                store_id: req.store_id,
                mobile_number: value.mobile_number
            }
        });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CUSTOMER_EXISTS',
                    message: 'Customer with this mobile number already exists'
                }
            });
        }

        // Handle WhatsApp opt-in
        if (value.whatsapp_opt_in) {
            value.whatsapp_opt_in_date = new Date();
        }

        const customer = await Customer.create(value);

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: { customer }
        });

    } catch (error) {
        next(error);
    }
};

// Get all customers
exports.getAllCustomers = async(req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { search, whatsapp_opt_in } = req.query;

        const where = { store_id: req.store_id };

        // Search by name or mobile
        if (search) {
            where[Op.or] = [{
                    name: {
                        [Op.iLike]: `%${search}%`
                    }
                },
                {
                    mobile_number: {
                        [Op.iLike]: `%${search}%`
                    }
                }
            ];
        }

        // Filter by WhatsApp opt-in
        if (whatsapp_opt_in !== undefined) {
            where.whatsapp_opt_in = whatsapp_opt_in === 'true';
        }

        const { count, rows: customers } = await Customer.findAndCountAll({
            where,
            limit,
            offset,
            order: [
                ['created_at', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            data: { customers },
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

// Get customer by ID with purchase history
exports.getCustomerById = async(req, res, next) => {
    try {
        const customer = await Customer.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            },
            include: [{
                model: Sale,
                as: 'sales',
                limit: 10,
                order: [
                    ['sale_date', 'DESC']
                ],
                include: [{
                    model: SaleItem,
                    as: 'items',
                    attributes: ['product_name', 'quantity', 'subtotal']
                }]
            }]
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { customer }
        });

    } catch (error) {
        next(error);
    }
};

// Update customer
exports.updateCustomer = async(req, res, next) => {
    try {
        const { error, value } = validators.customerCreation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        const customer = await Customer.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        // Handle WhatsApp opt-in change
        if (value.whatsapp_opt_in && !customer.whatsapp_opt_in) {
            value.whatsapp_opt_in_date = new Date();
        }

        await customer.update(value);

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: { customer }
        });

    } catch (error) {
        next(error);
    }
};

// Delete customer
exports.deleteCustomer = async(req, res, next) => {
    try {
        const customer = await Customer.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        await customer.destroy();

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};
// Lookup customer by mobile number (for auto-fill at POS)
exports.lookupCustomer = async(req, res, next) => {
    try {
        const { mobile_number } = req.query;

        if (!mobile_number) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MOBILE_REQUIRED',
                    message: 'Mobile number is required'
                }
            });
        }

        const customer = await Customer.findOne({
            where: {
                store_id: req.store_id,
                mobile_number: mobile_number
            },
            attributes: [
                'id',
                'name',
                'mobile_number',
                'email',
                'address',
                'city',
                'date_of_birth',
                'anniversary_date',
                'total_purchases',
                'total_orders',
                'last_purchase_date',
                'whatsapp_opt_in'
            ]
        });

        if (!customer) {
            return res.status(200).json({
                success: true,
                data: {
                    found: false,
                    message: 'Customer not found. Ready to create new customer.'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                found: true,
                customer
            }
        });

    } catch (error) {
        next(error);
    }
};