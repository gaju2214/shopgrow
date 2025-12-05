const cron = require('node-cron');
const { Sale, SaleItem, Store, AnalyticsSummary, Product } = require('../models');
const { sequelize } = require('../config/database');
const { Op, QueryTypes } = require('sequelize');

async function computeForStore(storeId, date) {
  // date is a Date or string 'YYYY-MM-DD' representing the day to summarize
  const targetDate = (new Date(date)).toISOString().slice(0,10);

  // totals
  const summary = await Sale.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_sales'],
      [sequelize.fn('SUM', sequelize.col('profit')), 'total_profit'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
    ],
    where: {
      store_id: storeId,
      [Op.and]: sequelize.where(sequelize.fn('DATE', sequelize.col('sale_date')), targetDate)
    },
    raw: true
  });

  // top product by qty
  const top = await SaleItem.findOne({
    attributes: ['product_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'qty']],
    include: [{ model: Sale, as: 'sale', where: { store_id: storeId, [Op.and]: sequelize.where(sequelize.fn('DATE', sequelize.col('sale_date')), targetDate) }, attributes: [] }],
    group: ['product_id'],
    order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
    limit: 1,
    raw: true
  });

  // slow product: product with least sold_qty (but excluding zero sales?) we'll include zero sold and pick lowest
  const slow = await sequelize.query(
    `SELECT p.id as product_id, COALESCE(SUM(si.quantity),0) as sold_qty
     FROM products p
     LEFT JOIN sale_items si ON si.product_id = p.id
     LEFT JOIN sales s ON si.sale_id = s.id AND DATE(s.sale_date) = :date AND s.store_id = :storeId
     WHERE p.store_id = :storeId
     GROUP BY p.id
     ORDER BY sold_qty ASC
     LIMIT 1`,
    { replacements: { date: targetDate, storeId }, type: QueryTypes.SELECT }
  );

  // Upsert into AnalyticsSummary
  await AnalyticsSummary.upsert({
    store_id: storeId,
    date: targetDate,
    total_sales: parseFloat(summary.total_sales) || 0,
    total_profit: parseFloat(summary.total_profit) || 0,
    total_orders: parseInt(summary.total_orders) || 0,
    top_product: top?.product_id || null,
    slow_product: slow[0]?.product_id || null
  });
}

async function runDailyJob() {
  try {
    const stores = await Store.findAll({ attributes: ['id'] });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const target = yesterday.toISOString().slice(0,10);

    for (const s of stores) {
      try { await computeForStore(s.id, target); } catch (e) { console.error('Analytics compute error for store', s.id, e?.message || e); }
    }

    console.log('[AnalyticsJob] Completed daily analytics for', target);
  } catch (err) {
    console.error('[AnalyticsJob] Failed', err?.message || err);
  }
}

exports.startAnalyticsJob = () => {
  try {
    // Run once at startup in case missed
    runDailyJob();

    // Schedule everyday at 00:30 (server time)
    cron.schedule('30 0 * * *', () => {
      console.log('[AnalyticsJob] Triggered nightly aggregation');
      runDailyJob();
    });

    console.log('[AnalyticsJob] Scheduled nightly analytics job');
  } catch (e) {
    console.error('[AnalyticsJob] Error scheduling job', e?.message || e);
  }
};

// Export compute functions so other parts of the app can trigger aggregation on-demand
exports.computeForStore = computeForStore;
exports.runDailyJob = runDailyJob;

module.exports = exports;
