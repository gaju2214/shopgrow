const { Category, Product } = require('../models');
const validators = require('../utils/validators');

// Create category
exports.createCategory = async(req, res, next) => {
    try {
        const { error, value } = validators.categoryCreation.validate(req.body);
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

        const category = await Category.create(value);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });

    } catch (error) {
        next(error);
    }
};

// Get all categories
exports.getAllCategories = async(req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { store_id: req.store_id, is_active: true },
            include: [{
                model: Category,
                as: 'subCategories',
                attributes: ['id', 'name']
            }],
            order: [
                ['name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        next(error);
    }
};

// Get single category
exports.getCategoryById = async(req, res, next) => {
    try {
        const category = await Category.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            },
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id', 'name', 'selling_price', 'stock_quantity']
            }]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CATEGORY_NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { category }
        });

    } catch (error) {
        next(error);
    }
};

// Update category
exports.updateCategory = async(req, res, next) => {
    try {
        const { error, value } = validators.categoryCreation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }

        const category = await Category.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CATEGORY_NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        await category.update(value);

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });

    } catch (error) {
        next(error);
    }
};

// Delete category
exports.deleteCategory = async(req, res, next) => {
    try {
        const category = await Category.findOne({
            where: {
                id: req.params.id,
                store_id: req.store_id
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CATEGORY_NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        await category.update({ is_active: false });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};