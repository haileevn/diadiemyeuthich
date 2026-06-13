// node seed.js  – chèn dữ liệu mẫu vào bảng places (chỉ khi bảng trống)
require('dotenv').config();
const db = require('./db');

const DEFAULT_PLACES = [
  {
    name: 'Phở Thìn Lò Đúc', category: 'food',
    tags: ['Phở', 'Bắc', 'Truyền thống'],
    rating: 4.8, reviews: 2341, distance: 0.4, price: '$$',
    address: '13 Lò Đúc, Hai Bà Trưng, Hà Nội',
    hours: '6:00 - 22:00', phone: '024 3943 7394',
    description: 'Phở bò xào nổi tiếng Hà Nội với công thức gia truyền hơn 50 năm. Nước dùng đậm đà, thịt bò tươi ngon.',
    images: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80'],
    lat: 21.0245, lng: 105.8542,
  },
  {
    name: 'Bún Chả Hương Liên', category: 'food',
    tags: ['Bún Chả', 'Bắc', 'Nổi tiếng'],
    rating: 4.7, reviews: 5892, distance: 0.8, price: '$$',
    address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội',
    hours: '8:00 - 20:00', phone: '024 3943 4106',
    description: 'Quán bún chả nổi tiếng thế giới, từng phục vụ Tổng thống Obama. Bún chả thơm lừng, chả nướng vàng đều.',
    images: ['https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80'],
    lat: 21.0222, lng: 105.8432,
  },
  {
    name: 'The Coffee House', category: 'cafe',
    tags: ['Cà phê', 'Trà sữa', 'Cozy'],
    rating: 4.5, reviews: 3201, distance: 1.2, price: '$',
    address: '86 Cầu Giấy, Cầu Giấy, Hà Nội',
    hours: '7:00 - 23:00', phone: '1800 6936',
    description: 'Chuỗi cà phê Việt Nam phổ biến với không gian thoải mái, menu đa dạng từ cà phê đến trà và bánh ngọt.',
    images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80'],
    lat: 21.0329, lng: 105.7923,
  },
  {
    name: 'Vui Phết Bowling', category: 'fun',
    tags: ['Bowling', 'Giải trí', 'Nhóm bạn'],
    rating: 4.3, reviews: 876, distance: 1.8, price: '$$$',
    address: 'Tầng 4, Vincom Center, 191 Bà Triệu, HN',
    hours: '9:00 - 23:00', phone: '024 3974 3900',
    description: 'Trung tâm bowling hiện đại với 20 làn, ánh sáng UV độc đáo. Thích hợp cho nhóm bạn và gia đình.',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80'],
    lat: 21.0194, lng: 105.8452,
  },
  {
    name: 'Bánh Mì Phố Cổ', category: 'food',
    tags: ['Bánh Mì', 'Nhanh', 'Ngon'],
    rating: 4.6, reviews: 1432, distance: 0.6, price: '$',
    address: '36 Đinh Liệt, Hoàn Kiếm, Hà Nội',
    hours: '6:30 - 21:00', phone: '091 234 5678',
    description: 'Bánh mì giòn rụm với nhân phong phú, nước sốt đặc biệt. Xếp hàng là vì ngon có lý do!',
    images: ['https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80'],
    lat: 21.0338, lng: 105.8510,
  },
  {
    name: 'Escape Room Hà Nội', category: 'fun',
    tags: ['Escape Room', 'Phiêu lưu', 'Nhóm'],
    rating: 4.7, reviews: 654, distance: 2.1, price: '$$',
    address: 'Tầng 3, 25 Điện Biên Phủ, Ba Đình, HN',
    hours: '10:00 - 22:00', phone: '098 765 4321',
    description: 'Trải nghiệm thoát phòng kỳ bí với 8 chủ đề khác nhau. Thử thách tư duy và làm việc nhóm cùng bạn bè.',
    images: ['https://images.unsplash.com/photo-1609743522653-52354461eb27?w=600&q=80'],
    lat: 21.0384, lng: 105.8412,
  },
  {
    name: 'Cà Phê Trứng Giảng', category: 'cafe',
    tags: ['Cà phê trứng', 'Truyền thống', 'Iconic'],
    rating: 4.9, reviews: 8921, distance: 1.4, price: '$',
    address: '39 Nguyễn Hữu Huân, Hoàn Kiếm, HN',
    hours: '7:00 - 22:00', phone: '024 3828 7043',
    description: 'Quán cà phê trứng huyền thoại Hà Nội từ 1946. Cà phê trứng béo ngậy, thơm nồng, là biểu tượng ẩm thực thủ đô.',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80'],
    lat: 21.0337, lng: 105.8517,
  },
  {
    name: 'CGV Vincom Bà Triệu', category: 'fun',
    tags: ['Phim', 'Giải trí', 'IMAX'],
    rating: 4.4, reviews: 4231, distance: 2.3, price: '$$',
    address: 'Tầng 6, Vincom Bà Triệu, Hai Bà Trưng, HN',
    hours: '8:30 - 24:00', phone: '1900 6017',
    description: 'Rạp chiếu phim CGV với công nghệ IMAX, 4DX hiện đại nhất Hà Nội. Ghế ngồi thoải mái, âm thanh sống động.',
    images: ['https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80'],
    lat: 21.0193, lng: 105.8440,
  },
  {
    name: 'Kichi Kichi Lotte', category: 'food',
    tags: ['Lẩu', 'Buffet', 'Nhóm'],
    rating: 4.2, reviews: 3450, distance: 1.9, price: '$$$',
    address: 'Tầng 4, Lotte Center, 54 Liễu Giai, Ba Đình, HN',
    hours: '10:00 - 22:00', phone: '1900 600 605',
    description: 'Lẩu băng chuyền độc đáo với hơn 100 loại nguyên liệu tươi. Không gian rộng rãi, giá cả hợp lý theo buffet.',
    images: ['https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80'],
    lat: 21.0406, lng: 105.8134,
  },
  {
    name: 'Highlands Coffee', category: 'cafe',
    tags: ['Cà phê', 'Làm việc', 'Wifi nhanh'],
    rating: 4.3, reviews: 2890, distance: 0.9, price: '$$',
    address: '28 Lý Thường Kiệt, Hoàn Kiếm, HN',
    hours: '7:00 - 22:30', phone: '1800 6278',
    description: 'Chuỗi cà phê Việt cao cấp với không gian làm việc, học tập lý tưởng. Wifi mạnh, ổ cắm điện đủ bàn.',
    images: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80'],
    lat: 21.0286, lng: 105.8500,
  },
  {
    name: 'Karaoke Queen', category: 'fun',
    tags: ['Karaoke', 'Giải trí', 'Bạn bè'],
    rating: 4.1, reviews: 1234, distance: 1.5, price: '$$',
    address: '12 Hàng Bài, Hoàn Kiếm, HN',
    hours: '15:00 - 02:00', phone: '024 3826 5555',
    description: 'Karaoke sang trọng với phòng riêng từ 4-20 người. Âm thanh Pro, hệ thống bài hát mới nhất, đồ ăn vặt đầy đủ.',
    images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80'],
    lat: 21.0270, lng: 105.8520,
  },
  {
    name: 'Nem Cua Bể Bà Lý', category: 'food',
    tags: ['Hải sản', 'Nem', 'Hà Nội'],
    rating: 4.5, reviews: 987, distance: 3.2, price: '$$',
    address: '6 Tô Hiến Thành, Hai Bà Trưng, HN',
    hours: '10:00 - 21:00', phone: '091 987 6543',
    description: 'Nem cua bể tươi ngon, cuốn chặt tay với rau thơm và bún. Nước chấm đặc biệt theo công thức bí truyền.',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'],
    lat: 21.0225, lng: 105.8456,
  },
];

async function seed() {
  console.log('Kết nối database...');
  const { rows } = await db.query('SELECT COUNT(*) FROM places');
  const count = parseInt(rows[0].count);
  if (count > 0) {
    console.log(`Database đã có ${count} địa điểm. Bỏ qua seed.`);
    process.exit(0);
  }

  console.log(`Chèn ${DEFAULT_PLACES.length} địa điểm mẫu...`);
  for (const p of DEFAULT_PLACES) {
    await db.query(
      `INSERT INTO places
         (name, category, tags, rating, reviews, distance, price, address, hours, phone, description, images, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [p.name, p.category, JSON.stringify(p.tags), p.rating, p.reviews, p.distance, p.price, p.address, p.hours, p.phone, p.description, JSON.stringify(p.images), p.lat, p.lng]
    );
    process.stdout.write('.');
  }
  console.log('\n✅ Seed xong!');
  process.exit(0);
}

seed().catch(e => {
  console.error('Lỗi seed:', e.message);
  process.exit(1);
});
