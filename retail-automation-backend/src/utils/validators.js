const Joi = require('joi');

// Store registration validation
const storeRegistration = Joi.object({
  store_name: Joi.string().min(2).max(200).required(),
  store_logo_url: Joi.string().uri().allow(null, ''),
  store_address: Joi.string().max(500).allow(null, ''),
  store_city: Joi.string().max(100).allow(null, ''),
  store_category: Joi.string().max(100).allow(null, ''),
  gstn: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i).allow(null, ''),
  mobile_number: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

// Store login validation
const storeLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product creation validation
const productCreation = Joi.object({
  category_id: Joi.string().uuid().allow(null, ''),
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow(null, ''),
  sku: Joi.string().max(100).allow(null, ''),
  image_urls: Joi.array().items(Joi.string().uri()).default([]),
  cost_price: Joi.number().min(0).required(),
  selling_price: Joi.number().min(0).required(),
  stock_quantity: Joi.number().integer().min(0).default(0),
  low_stock_threshold: Joi.number().integer().min(0).default(10),
  unit: Joi.string().max(20).default('piece')
});

// Category creation validation
const categoryCreation = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow(null, ''),
  parent_category_id: Joi.string().uuid().allow(null, '')
});

// Customer creation validation
const customerCreation = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  mobile_number: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email: Joi.string().email().allow(null, ''),
  address: Joi.string().max(500).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  date_of_birth: Joi.date().allow(null, ''),
  anniversary_date: Joi.date().allow(null, ''),
  preferred_categories: Joi.array().items(Joi.string().uuid()).default([]),
  whatsapp_opt_in: Joi.boolean().default(false)
});

// Sale creation validation (updated)
const saleCreation = Joi.object({
  customer_mobile: Joi.string().pattern(/^[6-9]\d{9}$/).allow(null, ''),
  customer_name: Joi.string().min(2).max(200).when('customer_mobile', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.optional()
  }),
  customer_email: Joi.string().email().allow(null, ''),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  payment_method: Joi.string().valid('cash', 'card', 'upi', 'online').default('cash'),
  discount_amount: Joi.number().min(0).default(0),
  tax_amount: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).allow(null, '')
});

module.exports = {
  storeRegistration,
  storeLogin,
  productCreation,
  categoryCreation,
  customerCreation,
  saleCreation
};
