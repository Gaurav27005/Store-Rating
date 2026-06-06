const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidation, storeValidation, handleValidation } = require('../middleware/validate');

const isAdmin = [authenticate, authorize('admin')];

// --- DASHBOARD & RATINGS ---
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [u, s, r] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM stores'),
      pool.query('SELECT COUNT(*) FROM ratings'),
    ]);
    res.json({ totalUsers: parseInt(u.rows[0].count), totalStores: parseInt(s.rows[0].count), totalRatings: parseInt(r.rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/all-ratings', isAdmin, async (req, res) => {
  try {
    const { storeName, sort = 'updated_at', order = 'DESC' } = req.query;
    const sortCol = ['updated_at', 'rating'].includes(sort) ? sort : 'updated_at';
    let query = `SELECT r.id, r.rating, r.feedback, r.updated_at, u.name AS reviewer_name, s.name AS store_name FROM ratings r JOIN users u ON u.id = r.user_id JOIN stores s ON s.id = r.store_id`;
    const params = [];
    if (storeName && storeName.trim()) { query += ` WHERE s.name ILIKE $1`; params.push(`%${storeName}%`); }
    query += ` ORDER BY r.${sortCol} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    res.json((await pool.query(query, params)).rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/ratings/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM ratings WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// --- USER MANAGEMENT ---
router.post('/users', isAdmin, userValidation, handleValidation, async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(`INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [name, email, hash, address, role]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/users', isAdmin, async (req, res) => {
  try {
    const { name, role } = req.query;
    let query = `SELECT id,name,email,role FROM users`;
    const params = [];
    if (name) { query += ` WHERE name ILIKE $1`; params.push(`%${name}%`); }
    res.json({ users: (await pool.query(query, params)).rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// --- STORE MANAGEMENT ---
router.get('/stores', isAdmin, async (req, res) => {
  try {
    const query = `SELECT s.*, u.email AS owner_email, ROUND(AVG(r.rating),1) as avg_rating FROM stores s LEFT JOIN users u ON s.owner_id=u.id LEFT JOIN ratings r ON s.id=r.store_id GROUP BY s.id, u.email`;
    res.json({ stores: (await pool.query(query)).rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// --- REQUESTS ---
router.get('/requests', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT sr.*, u.name as user_name FROM store_requests sr JOIN users u ON u.id=sr.user_id WHERE status='pending'`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/requests/:id/approve', isAdmin, async (req, res) => {
  try {
    await pool.query('BEGIN');
    const r = (await pool.query('SELECT * FROM store_requests WHERE id=$1', [req.params.id])).rows[0];
    if (r.type === 'add_store') {
      await pool.query(`UPDATE users SET role='store_owner' WHERE id=$1`, [r.user_id]);
      await pool.query(`INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4)`, [r.store_name, r.store_email, r.store_address, r.user_id]);
    }
    await pool.query(`UPDATE store_requests SET status='approved' WHERE id=$1`, [req.params.id]);
    await pool.query('COMMIT');
    res.json({ message: 'Approved' });
  } catch (err) { await pool.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;