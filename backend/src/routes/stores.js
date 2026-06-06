const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { ratingValidation, handleValidation } = require('../middleware/validate');

// GET /api/stores
router.get('/', authenticate, authorize('user', 'admin'), async (req, res) => {
  try {
    const { name, address, sort = 'name', order = 'ASC', page = 1, limit = 12 } = req.query;
    const userId = req.user.id;
    const conditions  = [];
    const filterParams = [];

    if (name)    { conditions.push(`s.name    ILIKE $${filterParams.length + 1}`); filterParams.push(`%${name}%`); }
    if (address) { conditions.push(`s.address ILIKE $${filterParams.length + 1}`); filterParams.push(`%${address}%`); }

    const where    = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortDir  = order === 'ASC' ? 'ASC' : 'DESC';
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(50,  parseInt(limit) || 12);
    const offset   = (pageNum - 1) * limitNum;

    const mainParams = [userId, ...filterParams, limitNum, offset];
    const limitIdx   = mainParams.length - 1;
    const offsetIdx  = mainParams.length;

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
        s.id, s.name, s.address,
        ROUND(AVG(r.rating),  1) AS avg_rating,
        COUNT(r.id)              AS rating_count,
        ur.rating                AS user_rating,
        ur.feedback              AS user_feedback
      FROM stores s
      LEFT JOIN ratings r  ON r.store_id = s.id
      LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = $1
      ${mainWhere}
      GROUP BY s.id, ur.rating, ur.feedback
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
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
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
      const { rating, feedback }  = req.body;

      const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
      if (storeCheck.rows.length === 0) return res.status(404).json({ error: 'Store not found' });

      const result = await pool.query(`
        INSERT INTO ratings (store_id, user_id, rating, feedback)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (store_id, user_id)
          DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback, updated_at = NOW()
        RETURNING *
      `, [storeId, req.user.id, rating, feedback || null]);

      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
  }
);

// GET /api/stores/:storeId/reviews
router.get('/:storeId/reviews', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    const result = await pool.query(`
      SELECT r.id, r.rating, r.feedback, r.updated_at, u.name AS reviewer_name, u.id AS reviewer_id
      FROM ratings r
      JOIN users u ON u.id = r.user_id
      WHERE r.store_id = $1
      ORDER BY r.updated_at DESC
    `, [storeId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;