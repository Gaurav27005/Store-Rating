require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDB } = require('./src/db');

const authRoutes  = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const storeRoutes = require('./src/routes/stores');
const ownerRoutes = require('./src/routes/owner');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth',   authRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/owner',  ownerRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => console.log(`🚀 RateStore API  →  http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
};
start();
