const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/owner/stores
router.get('/stores', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id,s.name,s.address,s.email,
         ROUND(AVG(r.rating),2) AS avg_rating, COUNT(r.id) AS total_ratings
       FROM stores s
       LEFT JOIN ratings r ON r.store_id=s.id
       WHERE s.owner_id=$1
       GROUP BY s.id ORDER BY s.name ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/owner/stores/:storeId
router.get('/stores/:storeId', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const storeResult = await pool.query(
      'SELECT id,name,address,email FROM stores WHERE id=$1 AND owner_id=$2',
      [storeId, req.user.id]
    );
    if (storeResult.rows.length === 0) return res.status(404).json({ error: 'Store not found or not owned by you' });
    const store = storeResult.rows[0];
    
    // Updated to pull r.feedback
    const [stats, raters] = await Promise.all([
      pool.query('SELECT ROUND(AVG(rating),2) AS avg_rating,COUNT(*) AS total FROM ratings WHERE store_id=$1',[storeId]),
      pool.query(`SELECT u.id, u.name, u.email, u.address, r.rating, r.feedback, r.updated_at
        FROM ratings r JOIN users u ON u.id=r.user_id
        WHERE r.store_id=$1 ORDER BY r.updated_at DESC`,[storeId]),
    ]);
    res.json({
      store,
      avgRating: stats.rows[0].avg_rating ? parseFloat(stats.rows[0].avg_rating) : null,
      totalRatings: parseInt(stats.rows[0].total),
      raters: raters.rows,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/owner/requests 
router.post('/requests', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { type, store_id, store_name, store_email, store_address, note } = req.body;
    if (!['add_store','edit_store','delete_store'].includes(type)) return res.status(400).json({ error: 'Invalid request type' });
    if (type === 'add_store') {
      const pending = await pool.query(
        "SELECT id FROM store_requests WHERE user_id=$1 AND type='add_store' AND status='pending'",
        [req.user.id]
      );
      if (pending.rows.length > 0) return res.status(409).json({ error: 'You already have a pending store request' });
    }
    if ((type === 'edit_store' || type === 'delete_store') && store_id) {
      const owns = await pool.query('SELECT id FROM stores WHERE id=$1 AND owner_id=$2',[store_id,req.user.id]);
      if (owns.rows.length === 0) return res.status(403).json({ error: 'You do not own this store' });
    }
    const result = await pool.query(
      `INSERT INTO store_requests (user_id,type,store_id,store_name,store_email,store_address,note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id,type,store_id||null,store_name||null,store_email||null,store_address||null,note||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/owner/requests
router.get('/requests', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*,s.name AS store_name FROM store_requests sr
       LEFT JOIN stores s ON s.id=sr.store_id
       WHERE sr.user_id=$1 ORDER BY sr.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;