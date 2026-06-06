const express = require('express');
const router  = express.Router();
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/owner/stores — list all stores owned by this user
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

// GET /api/owner/stores/:storeId — single store dashboard
router.get('/stores/:storeId', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const storeResult = await pool.query(
      'SELECT id,name,address,email FROM stores WHERE id=$1 AND owner_id=$2',
      [storeId, req.user.id]
    );
    if (storeResult.rows.length === 0) return res.status(404).json({ error: 'Store not found or not owned by you' });
    const store = storeResult.rows[0];
    const [stats, raters] = await Promise.all([
      pool.query('SELECT ROUND(AVG(rating),2) AS avg_rating,COUNT(*) AS total FROM ratings WHERE store_id=$1',[storeId]),
      pool.query(`SELECT u.id,u.name,u.email,u.address,r.rating,r.updated_at
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

// PUT /api/owner/stores/:storeId — owner edits own store details
router.put('/stores/:storeId', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, email, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Store name is required' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Name must be at most 60 characters' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    // verify ownership
    const owns = await pool.query('SELECT id FROM stores WHERE id=$1 AND owner_id=$2',[storeId,req.user.id]);
    if (owns.rows.length === 0) return res.status(403).json({ error: 'You do not own this store' });
    // check email not taken by another store
    const dup = await pool.query('SELECT id FROM stores WHERE email=$1 AND id<>$2',[email,storeId]);
    if (dup.rows.length > 0) return res.status(409).json({ error: 'Email already used by another store' });
    const result = await pool.query(
      `UPDATE stores SET name=$1,email=$2,address=$3,updated_at=NOW() WHERE id=$4 RETURNING *`,
      [name.trim(),email,address||null,storeId]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/owner/profile — owner edits own profile
router.put('/profile', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (name.trim().length < 20) return res.status(400).json({ error: 'Name must be at least 20 characters' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Name must be at most 60 characters' });
    if (address && address.length > 400) return res.status(400).json({ error: 'Address too long' });
    const result = await pool.query(
      `UPDATE users SET name=$1,address=$2,updated_at=NOW() WHERE id=$3 RETURNING id,name,email,address,role`,
      [name.trim(),address||null,req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/owner/requests — submit store request (add/edit/delete)
router.post('/requests', authenticate, authorize('store_owner'), async (req, res) => {
  try {
    const { type, store_id, store_name, store_email, store_address, note } = req.body;
    if (!['add_store','edit_store','delete_store'].includes(type)) return res.status(400).json({ error: 'Invalid request type' });
    // For add_store, check no pending request already
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

// GET /api/owner/requests — owner's own requests
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
