const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { pool } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidation, storeValidation, handleValidation } = require('../middleware/validate');

const isAdmin = [authenticate, authorize('admin')];
const ALLOWED_USER_SORT  = ['name', 'email', 'address', 'role', 'created_at'];
const ALLOWED_STORE_SORT = ['name', 'email', 'address', 'created_at'];

// GET /api/admin/dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [users, stores, ratings] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM stores'),
      pool.query('SELECT COUNT(*) FROM ratings'),
    ]);
    res.json({
      totalUsers:   parseInt(users.rows[0].count),
      totalStores:  parseInt(stores.rows[0].count),
      totalRatings: parseInt(ratings.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users — create user
router.post('/users', isAdmin, userValidation, handleValidation, async (req, res) => {
  try {
    const { name, email, password, address, role = 'user' } = req.body;
    if (!['admin', 'user', 'store_owner'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'A user with this email already exists' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,address,role,created_at`,
      [name.trim(), email, hash, address || null, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/users/:id — edit user
router.put('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, role } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (name.trim().length < 20) return res.status(400).json({ error: 'Name must be at least 20 characters' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Name must be at most 60 characters' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (role && !['admin','user','store_owner'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    // check email not taken by another user
    const dup = await pool.query('SELECT id FROM users WHERE email=$1 AND id<>$2', [email, id]);
    if (dup.rows.length > 0) return res.status(409).json({ error: 'Email already in use by another account' });
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, address=$3, role=$4, updated_at=NOW() WHERE id=$5
       RETURNING id,name,email,address,role,created_at`,
      [name.trim(), email, address || null, role, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // prevent deleting yourself
    if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { name, email, address, role, sort='created_at', order='DESC', page=1, limit=50 } = req.query;
    const conditions = [], filterParams = [];
    if (name)    { conditions.push(`u.name    ILIKE $${filterParams.length+1}`); filterParams.push(`%${name}%`); }
    if (email)   { conditions.push(`u.email   ILIKE $${filterParams.length+1}`); filterParams.push(`%${email}%`); }
    if (address) { conditions.push(`u.address ILIKE $${filterParams.length+1}`); filterParams.push(`%${address}%`); }
    if (role)    { conditions.push(`u.role     =    $${filterParams.length+1}`); filterParams.push(role); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = ALLOWED_USER_SORT.includes(sort) ? sort : 'created_at';
    const sortDir = order==='ASC' ? 'ASC' : 'DESC';
    const pageNum = Math.max(1, parseInt(page)||1);
    const limitNum = Math.min(100, parseInt(limit)||50);
    const offset = (pageNum-1)*limitNum;
    const dataParams = [...filterParams, limitNum, offset];
    const dataQuery = `
      SELECT u.id,u.name,u.email,u.address,u.role,u.created_at,
        ROUND(AVG(r.rating),1) AS avg_rating
      FROM users u
      LEFT JOIN stores s ON s.owner_id=u.id
      LEFT JOIN ratings r ON r.store_id=s.id
      ${where} GROUP BY u.id
      ORDER BY u.${sortCol} ${sortDir}
      LIMIT $${dataParams.length-1} OFFSET $${dataParams.length}`;
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(`SELECT COUNT(DISTINCT u.id) FROM users u ${where}`, filterParams),
    ]);
    res.json({ users: dataResult.rows, total: parseInt(countResult.rows[0].count), page: pageNum, totalPages: Math.ceil(parseInt(countResult.rows[0].count)/limitNum) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/users/:id
router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id,u.name,u.email,u.address,u.role,u.created_at,
        ROUND(AVG(r.rating),1) AS store_rating,
        json_agg(json_build_object('id',s.id,'name',s.name)) FILTER (WHERE s.id IS NOT NULL) AS stores
      FROM users u
      LEFT JOIN stores s ON s.owner_id=u.id
      LEFT JOIN ratings r ON r.store_id=s.id
      WHERE u.id=$1 GROUP BY u.id`, [req.params.id]);
    if (result.rows.length===0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/stores
router.post('/stores', isAdmin, storeValidation, handleValidation, async (req, res) => {
  try {
    const { name, email, address, owner_id } = req.body;
    const existing = await pool.query('SELECT id FROM stores WHERE email=$1', [email]);
    if (existing.rows.length>0) return res.status(409).json({ error: 'A store with this email already exists' });
    if (owner_id) {
      const owner = await pool.query("SELECT id FROM users WHERE id=$1 AND role='store_owner'", [owner_id]);
      if (owner.rows.length===0) return res.status(400).json({ error: 'Owner must be a Store Owner role user' });
    }
    const result = await pool.query(
      `INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name.trim(), email, address||null, owner_id||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/admin/stores/:id — edit store
router.put('/stores/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, owner_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Store name is required' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Name must be at most 60 characters' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    const dup = await pool.query('SELECT id FROM stores WHERE email=$1 AND id<>$2', [email, id]);
    if (dup.rows.length>0) return res.status(409).json({ error: 'Email already used by another store' });
    if (owner_id) {
      const owner = await pool.query("SELECT id FROM users WHERE id=$1 AND role='store_owner'", [owner_id]);
      if (owner.rows.length===0) return res.status(400).json({ error: 'Owner must be a Store Owner role user' });
    }
    const result = await pool.query(
      `UPDATE stores SET name=$1,email=$2,address=$3,owner_id=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name.trim(), email, address||null, owner_id||null, id]
    );
    if (result.rows.length===0) return res.status(404).json({ error: 'Store not found' });
    res.json(result.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM stores WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length===0) return res.status(404).json({ error: 'Store not found' });
    res.json({ message: 'Store deleted successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/stores
router.get('/stores', isAdmin, async (req, res) => {
  try {
    const { name, email, address, sort='created_at', order='DESC', page=1, limit=50 } = req.query;
    const conditions=[], filterParams=[];
    if (name)    { conditions.push(`s.name    ILIKE $${filterParams.length+1}`); filterParams.push(`%${name}%`); }
    if (email)   { conditions.push(`s.email   ILIKE $${filterParams.length+1}`); filterParams.push(`%${email}%`); }
    if (address) { conditions.push(`s.address ILIKE $${filterParams.length+1}`); filterParams.push(`%${address}%`); }
    const where   = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortDir = order==='ASC' ? 'ASC' : 'DESC';
    const pageNum = Math.max(1, parseInt(page)||1);
    const limitNum = Math.min(100, parseInt(limit)||50);
    const offset  = (pageNum-1)*limitNum;
    const useRatingSort = sort==='avg_rating';
    const sortCol = ALLOWED_STORE_SORT.includes(sort) ? sort : 'created_at';
    const dataParams = [...filterParams, limitNum, offset];
    const dataQuery = `
      SELECT s.id,s.name,s.email,s.address,s.created_at,
        u.name AS owner_name, u.email AS owner_email,
        ROUND(AVG(r.rating),1) AS avg_rating, COUNT(r.id) AS rating_count
      FROM stores s
      LEFT JOIN users u ON u.id=s.owner_id
      LEFT JOIN ratings r ON r.store_id=s.id
      ${where} GROUP BY s.id,u.name,u.email
      ORDER BY ${useRatingSort ? 'AVG(r.rating)' : `s.${sortCol}`} ${sortDir} NULLS LAST
      LIMIT $${dataParams.length-1} OFFSET $${dataParams.length}`;
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(`SELECT COUNT(*) FROM stores s ${where}`, filterParams),
    ]);
    res.json({ stores: dataResult.rows, total: parseInt(countResult.rows[0].count), page: pageNum, totalPages: Math.ceil(parseInt(countResult.rows[0].count)/limitNum) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/store-owners
router.get('/store-owners', isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id,name,email FROM users WHERE role='store_owner' ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

// ── Store Requests (admin review) ─────────────────────────────────────────────

// GET /api/admin/requests
router.get('/requests', isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? `WHERE sr.status=$1` : '';
    const params = status ? [status] : [];
    const result = await pool.query(
      `SELECT sr.*,
         u.name AS user_name, u.email AS user_email,
         s.name AS store_name
       FROM store_requests sr
       JOIN users u ON u.id=sr.user_id
       LEFT JOIN stores s ON s.id=sr.store_id
       ${where} ORDER BY sr.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/admin/requests/:id/approve
router.patch('/requests/:id/approve', isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reqRow = await client.query('SELECT * FROM store_requests WHERE id=$1',[req.params.id]);
    if (reqRow.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found' }); }
    const r = reqRow.rows[0];
    if (r.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Request already processed' }); }

    if (r.type === 'add_store') {
      if (!r.store_name || !r.store_email) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Missing store data in request' }); }
      await client.query(
        `INSERT INTO stores (name,email,address,owner_id) VALUES ($1,$2,$3,$4)`,
        [r.store_name,r.store_email,r.store_address||null,r.user_id]
      );
    } else if (r.type === 'edit_store' && r.store_id) {
      await client.query(
        `UPDATE stores SET name=COALESCE($1,name),email=COALESCE($2,email),address=COALESCE($3,address),updated_at=NOW() WHERE id=$4`,
        [r.store_name,r.store_email,r.store_address,r.store_id]
      );
    } else if (r.type === 'delete_store' && r.store_id) {
      await client.query('DELETE FROM stores WHERE id=$1',[r.store_id]);
    }

    await client.query(`UPDATE store_requests SET status='approved',updated_at=NOW() WHERE id=$1`,[req.params.id]);
    await client.query('COMMIT');
    res.json({ message: 'Request approved' });
  } catch (err) { await client.query('ROLLBACK'); console.error(err); res.status(500).json({ error: 'Server error' }); }
  finally { client.release(); }
});

// PATCH /api/admin/requests/:id/reject
router.patch('/requests/:id/reject', isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE store_requests SET status='rejected',updated_at=NOW() WHERE id=$1 AND status='pending' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Request not found or already processed' });
    res.json({ message: 'Request rejected' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});
