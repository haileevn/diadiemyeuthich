const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }
  try {
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username.trim()]);
    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, username: admin.username });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau' });
  }
});

// POST /api/auth/setup  – tạo tài khoản admin đầu tiên (chỉ khi chưa có admin nào)
router.post('/setup', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu username hoặc password' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Mật khẩu phải ít nhất 8 ký tự' });
  }
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM admins');
    if (parseInt(rows[0].count) > 0) {
      return res.status(403).json({ error: 'Tài khoản admin đã tồn tại' });
    }
    const hash = await bcrypt.hash(password, 12);
    await db.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [username.trim(), hash]);
    res.json({ message: 'Tạo tài khoản admin thành công' });
  } catch (e) {
    console.error('Setup error:', e.message);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/auth/check – kiểm tra token còn hợp lệ không
router.get('/check', require('../middleware/auth'), (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

module.exports = router;
