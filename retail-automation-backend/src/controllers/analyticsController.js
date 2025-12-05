const { Sale, SaleItem, Product, AnalyticsSummary } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const analyticsJob = require('../jobs/analyticsJob');

// Return today's summary (or for provided date)
exports.getDaily = async (req, res, next) => {
  try {
    const storeId = req.store_id;
    const date = req.query.date ? new Date(req.query.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);

    const summary = await AnalyticsSummary.findOne({
      where: { store_id: storeId, date }
    });

    if (summary) {
      return res.status(200).json({ success: true, data: { summary } });
    }

    // Fallback compute from sales if summary not found
    const totals = await Sale.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_sales'],
        [sequelize.fn('SUM', sequelize.col('profit')), 'total_profit'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
      ],
      where: {
        store_id: storeId,
        [Op.and]: sequelize.where(sequelize.fn('DATE', sequelize.col('sale_date')), date)
      },
      raw: true
    });

    res.status(200).json({ success: true, data: { summary: totals } });
  } catch (error) { next(error); }
};

// 7-day trend
exports.getWeekly = async (req, res, next) => {
  try {
    const storeId = req.store_id;
    const rows = await AnalyticsSummary.findAll({
      where: { store_id: storeId },
      order: [['date','DESC']],
      limit: 7
    });

    res.status(200).json({ success: true, data: { trend: rows } });
  } catch (error) { next(error); }
};

// Top selling products (by quantity)
exports.getTopProducts = async (req, res, next) => {
  try {
    const storeId = req.store_id;
    const top = await SaleItem.findAll({
      attributes: [
        'product_id', 'product_name', [sequelize.fn('SUM', sequelize.col('quantity')), 'qty']
      ],
      include: [{ model: Sale, as: 'sale', where: { store_id: storeId }, attributes: [] }],
      group: ['product_id','product_name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(req.query.limit) || 5,
      raw: true
    });

    res.status(200).json({ success: true, data: { top } });
  } catch (error) { next(error); }
};

// Slow moving products (least sales)
exports.getSlowProducts = async (req, res, next) => {
  try {
    const storeId = req.store_id;

    const slow = await Product.findAll({
      where: { store_id: storeId },
      attributes: ['id','name','stock_quantity'],
      include: [
        {
          model: SaleItem,
          as: 'saleItems',
          attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('saleItems.quantity')), 0), 'sold_qty']],
          required: false
        }
      ],
      group: ['Product.id'],
      order: [[sequelize.literal('sold_qty'), 'ASC']],
      limit: parseInt(req.query.limit) || 5,
      raw: false
    });

    res.status(200).json({ success: true, data: { slow } });
  } catch (error) { next(error); }
};

module.exports = exports;

// Admin: trigger aggregation for authenticated store (optional date YYYY-MM-DD)
exports.runAggregation = async (req, res, next) => {
  try {
    const storeId = req.store_id;
    const date = req.body?.date || req.query?.date || null; // if null computeForStore will accept and format

    await analyticsJob.computeForStore(storeId, date || (new Date(Date.now() - 24 * 60 * 60 * 1000)).toISOString().slice(0,10));

    res.status(200).json({ success: true, message: 'Aggregation triggered', data: { store_id: storeId, date: date || 'yesterday' } });
  } catch (error) { next(error); }
};
