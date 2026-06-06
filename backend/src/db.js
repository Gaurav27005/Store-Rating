const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ratestore',
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(60)  NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        address     VARCHAR(400),
        role        VARCHAR(20)  NOT NULL DEFAULT 'user'
                      CHECK (role IN ('admin','user','store_owner')),
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS stores (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(60)  NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        address     VARCHAR(400),
        owner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ratings (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(store_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS store_requests (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type         VARCHAR(20) NOT NULL CHECK (type IN ('add_store','edit_store','delete_store')),
        status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        store_id     UUID REFERENCES stores(id) ON DELETE CASCADE,
        store_name   VARCHAR(60),
        store_email  VARCHAR(255),
        store_address VARCHAR(400),
        note         TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ratings_store   ON ratings(store_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_user    ON ratings(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
      CREATE INDEX IF NOT EXISTS idx_stores_owner    ON stores(owner_id);
      CREATE INDEX IF NOT EXISTS idx_req_user        ON store_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_req_status      ON store_requests(status);
    `);
    const adminCheck = await client.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Admin@123', 12);
      await client.query(
        `INSERT INTO users (name,email,password,address,role) VALUES ($1,$2,$3,$4,'admin')`,
        ['System Administrator','admin@ratestore.com',hash,'123 Admin Street, System City']
      );
      console.log('✅ Default admin created  →  admin@ratestore.com / Admin@123');
    }
    console.log('✅ Database ready');
  } finally { client.release(); }
};

module.exports = { pool, initDB };
