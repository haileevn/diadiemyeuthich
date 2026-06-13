require('dotenv').config();
const express = require('express');
const cors = require('cors');

const placesRouter = require('./routes/places');
const authRouter   = require('./routes/auth');

const app  = express();
const PORT = parseInt(process.env.PORT) || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

app.use('/api/places', placesRouter);
app.use('/api/auth',   authRouter);

app.get('/api/health', async (req, res) => {
  const db = require('./db');
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} không tồn tại` });
});

app.listen(PORT, () => {
  console.log(`✅ API server: http://localhost:${PORT}/api/health`);
});
