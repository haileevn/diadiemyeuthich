const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

function parseRow(row) {
  return {
    ...row,
    rating:   parseFloat(row.rating),
    distance: parseFloat(row.distance),
    reviews:  parseInt(row.reviews),
    tags:     Array.isArray(row.tags) ? row.tags : [],
    images:   Array.isArray(row.images) ? row.images : [],
  };
}

// GET /api/places  – public
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM places ORDER BY created_at ASC'
    );
    res.json(rows.map(parseRow));
  } catch (e) {
    console.error('GET /places:', e.message);
    res.status(500).json({ error: 'Không thể tải danh sách địa điểm' });
  }
});

// POST /api/places  – admin only
router.post('/', requireAuth, async (req, res) => {
  const { name, category, tags, rating, reviews, distance, price, address, hours, phone, description, images, lat, lng } = req.body;
  if (!name || !category || !address || lat == null || lng == null) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (name, category, address, lat, lng)' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO places
         (name, category, tags, rating, reviews, distance, price, address, hours, phone, description, images, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        name, category,
        JSON.stringify(tags || []),
        parseFloat(rating) || 0,
        parseInt(reviews) || 0,
        parseFloat(distance) || 0,
        price || '$$',
        address,
        hours || '',
        phone || '',
        description || '',
        JSON.stringify(images || []),
        parseFloat(lat),
        parseFloat(lng),
      ]
    );
    res.status(201).json(parseRow(rows[0]));
  } catch (e) {
    console.error('POST /places:', e.message);
    res.status(500).json({ error: 'Lỗi khi thêm địa điểm' });
  }
});

// PUT /api/places/:id  – admin only
router.put('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, tags, rating, reviews, distance, price, address, hours, phone, description, images, lat, lng } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE places SET
         name=$1, category=$2, tags=$3, rating=$4, reviews=$5, distance=$6, price=$7,
         address=$8, hours=$9, phone=$10, description=$11, images=$12, lat=$13, lng=$14,
         updated_at = NOW()
       WHERE id=$15
       RETURNING *`,
      [
        name, category,
        JSON.stringify(tags || []),
        parseFloat(rating) || 0,
        parseInt(reviews) || 0,
        parseFloat(distance) || 0,
        price || '$$',
        address,
        hours || '',
        phone || '',
        description || '',
        JSON.stringify(images || []),
        parseFloat(lat),
        parseFloat(lng),
        id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
    res.json(parseRow(rows[0]));
  } catch (e) {
    console.error('PUT /places/:id:', e.message);
    res.status(500).json({ error: 'Lỗi khi cập nhật địa điểm' });
  }
});

// DELETE /api/places/:id  – admin only
router.delete('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rowCount } = await db.query('DELETE FROM places WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
    res.json({ message: 'Đã xóa địa điểm thành công' });
  } catch (e) {
    console.error('DELETE /places/:id:', e.message);
    res.status(500).json({ error: 'Lỗi khi xóa địa điểm' });
  }
});

module.exports = router;
