const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { ratingValidation, handleValidation } = require('../middleware/validate');

// GET /api/stores  — browse stores (user + admin)
router.get('/', authenticate, authorize('user', 'admin'), async (req, res) => {
  try {
    const {
      name, address,
      sort = 'name', order = 'ASC',
      page = 1, limit = 12,
    } = req.query;

    const userId = req.user.id;

    // Build filter conditions with 1-based param index
    const conditions  = [];
    const filterParams = [];

    if (name)    { conditions.push(`s.name    ILIKE $${filterParams.length + 1}`); filterParams.push(`%${name}%`); }
    if (address) { conditions.push(`s.address ILIKE $${filterParams.length + 1}`); filterParams.push(`%${address}%`); }

    const where    = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortDir  = order === 'ASC' ? 'ASC' : 'DESC';
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(50,  parseInt(limit) || 12);
    const offset   = (pageNum - 1) * limitNum;

    // Main query:  $1 = userId, then filter params, then limit, offset
    const mainParams = [userId, ...filterParams, limitNum, offset];
    const limitIdx   = mainParams.length - 1;
    const offsetIdx  = mainParams.length;

    // Re-index WHERE conditions for main query (userId is $1, filters start at $2)
    const mainConditions  = [];
    let   mainIdx = 2;
    if (name)    { mainConditions.push(`s.name    ILIKE $${mainIdx++}`); }
    if (address) { mainConditions.push(`s.address ILIKE $${mainIdx++}`); }
    const mainWhere = mainConditions.length ? `WHERE ${mainConditions.join(' AND ')}` : '';

    const ALLOWED_SORT = ['name', 'address'];
    const useRatingSort = sort === 'avg_rating';
    const sortCol = ALLOWED_SORT.includes(sort) ? sort : 'name';

    const dataQuery = `
      SELECT
        s.id, s.name, s.address, s.email,
        ROUND(AVG(r.rating),  1) AS avg_rating,
        COUNT(r.id)              AS rating_count,
        ur.rating                AS user_rating
      FROM stores s
      LEFT JOIN ratings r  ON r.store_id = s.id
      LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = $1
      ${mainWhere}
      GROUP BY s.id, ur.rating
      ORDER BY ${useRatingSort ? 'AVG(r.rating)' : `s.${sortCol}`} ${sortDir} NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countQuery  = `SELECT COUNT(*) FROM stores s ${where}`;
    const countParams = [...filterParams];

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery,  mainParams),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      stores:     dataResult.rows,
      total:      parseInt(countResult.rows[0].count),
      page:       pageNum,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limitNum),
    });
  } catch (err) {
    console.error('Browse stores error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/stores/:storeId/rate
router.post(
  '/:storeId/rate',
  authenticate,
  authorize('user'),
  ratingValidation,
  handleValidation,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { rating }  = req.body;

      const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
      if (storeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const result = await pool.query(`
        INSERT INTO ratings (store_id, user_id, rating)
        VALUES ($1, $2, $3)
        ON CONFLICT (store_id, user_id)
          DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
        RETURNING *
      `, [storeId, req.user.id, rating]);

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Rate store error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
