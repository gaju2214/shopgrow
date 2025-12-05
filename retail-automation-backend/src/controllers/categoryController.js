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

        if (!req.store_id) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_REQUIRED',
                    message: 'Store authentication required. Please login again.'
                }
            });
        }

        value.store_id = req.store_id;

        let category;
        try {
            category = await Category.create(value);
        } catch (err) {
            console.error('Failed to create category:', err);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'DB_ERROR',
                    message: err.message || 'Failed to create category.'
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });

    } catch (error) {
        console.error('Category create error:', error);
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

// Express router for category (for direct import)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// सभी routes के लिए auth required
router.use(auth);

// Category CRUD routes
router.post('/', exports.createCategory);
router.get('/', exports.getAllCategories);
router.get('/:id', exports.getCategoryById);
router.put('/:id', exports.updateCategory);
router.delete('/:id', exports.deleteCategory);

module.exports = {
    ...exports,
    router
};