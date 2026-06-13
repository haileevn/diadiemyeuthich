import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, MapPin, Star, X, Check, AlertTriangle, LogOut, Lock, Eye, EyeOff } from 'lucide-react';
import { CATEGORY_META, PRICE_META } from '../data/places';
import { api } from '../api';

const EMPTY_FORM = {
  name: '', category: 'food', tags: '', rating: '4.5', reviews: '0',
  distance: '1.0', price: '$$', address: '', hours: '8:00 - 22:00',
  phone: '', description: '',
  images: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
  lat: '21.0285', lng: '105.8542',
};

// ─── Form thêm / sửa địa điểm ────────────────────────────────────────────────
function PlaceForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name = 'Bắt buộc';
    if (!form.address.trim())     e.address = 'Bắt buộc';
    if (!form.description.trim()) e.description = 'Bắt buộc';
    if (isNaN(parseFloat(form.lat)) || isNaN(parseFloat(form.lng))) e.coords = 'Tọa độ không hợp lệ';
    if (isNaN(parseFloat(form.rating)) || parseFloat(form.rating) < 1 || parseFloat(form.rating) > 5) e.rating = '1.0 - 5.0';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      ...form,
      tags:     form.tags.split(',').map(t => t.trim()).filter(Boolean),
      rating:   parseFloat(form.rating),
      reviews:  parseInt(form.reviews) || 0,
      distance: parseFloat(form.distance) || 1,
      lat:      parseFloat(form.lat),
      lng:      parseFloat(form.lng),
      images:   form.images.split('\n').map(u => u.trim()).filter(Boolean),
    });
  };

  const Field = ({ label, name, type = 'text', placeholder, multiline, error }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
        {label}
        {error && <span className="text-red-500 font-normal">— {error}</span>}
      </label>
      {multiline ? (
        <textarea
          value={form[name]} onChange={e => set(name, e.target.value)}
          placeholder={placeholder} rows={3}
          className={`w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none focus:border-red-400 transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
        />
      ) : (
        <input
          type={type} value={form[name]} onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-red-400 transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[92%] rounded-t-2xl flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-black text-gray-900">{initial?.id ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}</h2>
          <button onClick={onCancel} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <Field label="Tên địa điểm *" name="name" placeholder="VD: Phở Thìn Lò Đúc" error={errors.name} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Danh mục</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400">
                {Object.entries(CATEGORY_META).map(([k, m]) => <option key={k} value={k}>{m.emoji} {m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Mức giá</label>
              <select value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400">
                {Object.entries(PRICE_META).map(([k, m]) => <option key={k} value={k}>{k} · {m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Tags <span className="font-normal text-gray-400">(cách bằng dấu phẩy)</span></label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)}
              placeholder="VD: Phở, Bắc, Truyền thống"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400" />
            {form.tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="bg-red-50 text-red-500 text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          <Field label="Địa chỉ *" name="address" placeholder="VD: 13 Lò Đúc, Hai Bà Trưng, Hà Nội" error={errors.address} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Giờ mở cửa" name="hours" placeholder="6:00 - 22:00" />
            <Field label="Số điện thoại" name="phone" type="tel" placeholder="024 xxxx xxxx" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Đánh giá {errors.rating && <span className="text-red-500">— {errors.rating}</span>}
              </label>
              <input type="number" min="1" max="5" step="0.1" value={form.rating}
                onChange={e => set('rating', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-red-400 ${errors.rating ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Reviews</label>
              <input type="number" min="0" value={form.reviews} onChange={e => set('reviews', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Cách (km)</label>
              <input type="number" min="0" step="0.1" value={form.distance} onChange={e => set('distance', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <MapPin size={11} className="text-red-400" />
              Tọa độ GPS {errors.coords && <span className="text-red-500 font-normal">— {errors.coords}</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)}
                placeholder="Vĩ độ (lat)"
                className={`px-3 py-2 rounded-xl border text-sm outline-none focus:border-red-400 ${errors.coords ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`} />
              <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)}
                placeholder="Kinh độ (lng)"
                className={`px-3 py-2 rounded-xl border text-sm outline-none focus:border-red-400 ${errors.coords ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`} />
            </div>
            <p className="text-xs text-gray-400">💡 Nhấn giữ vị trí trong Google Maps → copy tọa độ</p>
          </div>

          <Field label="Mô tả *" name="description" multiline placeholder="Mô tả chi tiết về địa điểm..." error={errors.description} />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">URL ảnh <span className="font-normal text-gray-400">(mỗi dòng 1 URL)</span></label>
            <textarea value={form.images} onChange={e => set('images', e.target.value)}
              placeholder="https://..." rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none outline-none focus:border-red-400" />
            {form.images.split('\n')[0].trim() && (
              <img src={form.images.split('\n')[0].trim()} alt="preview"
                className="w-full h-28 object-cover rounded-xl"
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-sm shadow-red-200 flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? (
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Đang lưu...</span>
            ) : (
              <><Check size={16} />{initial?.id ? 'Lưu thay đổi' : 'Thêm địa điểm'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm xóa ─────────────────────────────────────────────────────────────
function DeleteConfirm({ place, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h3 className="font-black text-gray-900 text-center text-lg">Xóa địa điểm?</h3>
        <p className="text-gray-500 text-sm text-center mt-2">
          Bạn chắc muốn xóa <strong>"{place.name}"</strong>? Không thể hoàn tác.
        </p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm disabled:opacity-50">
            Hủy
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
            {deleting ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Màn hình đăng nhập ───────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, username } = await api.login(form.username.trim(), form.password);
      api.saveToken(token);
      onLogin(username);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-red-200">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Đăng nhập Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Quản lý địa điểm yêu thích</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Tên đăng nhập</label>
            <input
              type="text" autoComplete="username" autoFocus
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400 focus:bg-white transition-colors"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-sm shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-60">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Đang đăng nhập...</>
              : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Chưa có tài khoản? Chạy <code className="bg-gray-100 px-1 rounded">POST /api/auth/setup</code> trên server
        </p>
      </div>
    </div>
  );
}

// ─── AdminScreen chính ────────────────────────────────────────────────────────
export default function AdminScreen({ places, onRefresh }) {
  const [adminUser, setAdminUser] = useState(null);   // username khi đã đăng nhập
  const [authChecked, setAuthChecked] = useState(false);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editingPlace, setEditingPlace] = useState(null);
  const [isAdding, setIsAdding]   = useState(false);
  const [deletingPlace, setDeletingPlace] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Kiểm tra token còn hợp lệ không khi mở màn hình
  useEffect(() => {
    const token = api.getToken();
    if (!token) { setAuthChecked(true); return; }
    api.checkToken()
      .then(({ username }) => setAdminUser(username))
      .catch(() => api.clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = () => {
    api.clearToken();
    setAdminUser(null);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editingPlace) {
        await api.editPlace(editingPlace.id, data);
        showToast(`Đã cập nhật "${data.name}"`);
        setEditingPlace(null);
      } else {
        await api.addPlace(data);
        showToast(`Đã thêm "${data.name}"`);
        setIsAdding(false);
      }
      onRefresh();
    } catch (e) {
      showToast(e.message || 'Lỗi khi lưu, thử lại sau', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePlace(deletingPlace.id);
      showToast(`Đã xóa "${deletingPlace.name}"`, 'error');
      setDeletingPlace(null);
      onRefresh();
    } catch (e) {
      showToast(e.message || 'Lỗi khi xóa', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Loading auth check
  if (!authChecked) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <span className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Chưa đăng nhập → hiện login screen
  if (!adminUser) {
    return <LoginScreen onLogin={(username) => setAdminUser(username)} />;
  }

  const filtered = places.filter(p => {
    const matchCat    = filterCat === 'all' || p.category === filterCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between pt-4 mb-3">
          <div>
            <h1 className="font-black text-gray-900 text-xl leading-none">Quản lý</h1>
            <p className="text-gray-400 text-xs mt-0.5">{places.length} địa điểm · {adminUser}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-red-200"
            >
              <Plus size={15} /> Thêm mới
            </button>
            <button onClick={handleLogout} title="Đăng xuất"
              className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <LogOut size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, địa chỉ..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-200 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[{ id: 'all', label: 'Tất cả', emoji: '📍' },
            ...Object.entries(CATEGORY_META).map(([id, m]) => ({ id, label: m.label, emoji: m.emoji }))
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilterCat(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterCat === tab.id ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 flex-shrink-0">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const count = places.filter(p => p.category === cat).length;
          return (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`flex-1 rounded-xl py-2 px-2 text-center transition-all border ${
                filterCat === cat ? 'border-transparent shadow-sm' : 'border-gray-200 bg-white'}`}
              style={{ background: filterCat === cat ? meta.bg : undefined }}>
              <div className="text-lg leading-none">{meta.emoji}</div>
              <div className="text-sm font-black mt-0.5" style={{ color: meta.color }}>{count}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-none">{meta.label}</div>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🔍</span>
            <p className="text-gray-400 text-sm">Không tìm thấy địa điểm nào</p>
          </div>
        ) : filtered.map(place => {
          const meta = CATEGORY_META[place.category];
          return (
            <div key={place.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="flex gap-3 p-3">
                <div className="relative flex-shrink-0">
                  <img src={place.images[0]} alt={place.name} className="w-16 h-16 rounded-xl object-cover" />
                  <span className="absolute -top-1 -right-1 text-xs px-1 rounded-full text-white font-bold"
                    style={{ background: meta.color, fontSize: 10 }}>{meta.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{place.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-600">{place.rating}</span>
                    <span className="text-gray-200 text-xs">·</span>
                    <span className="text-xs font-medium" style={{ color: meta.color }}>{place.price}</span>
                    <span className="text-gray-200 text-xs">·</span>
                    <MapPin size={10} className="text-red-400" />
                    <span className="text-xs text-red-500">{place.distance}km</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{place.address}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(place.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: meta.bg, color: meta.color }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingPlace({ ...place, tags: (place.tags || []).join(', '), images: (place.images || []).join('\n') })}
                    className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Pencil size={13} className="text-blue-500" />
                  </button>
                  <button onClick={() => setDeletingPlace(place)}
                    className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="px-3 pb-2.5 flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={10} className="text-gray-300" />
                <span>{Number(place.lat).toFixed(4)}, {Number(place.lng).toFixed(4)}</span>
                <span className="text-gray-200 mx-1">·</span>
                <span>{place.hours}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {(isAdding || editingPlace) && (
        <PlaceForm
          initial={editingPlace}
          onSave={handleSave}
          onCancel={() => { setIsAdding(false); setEditingPlace(null); }}
          saving={saving}
        />
      )}
      {deletingPlace && (
        <DeleteConfirm
          place={deletingPlace}
          onConfirm={handleDelete}
          onCancel={() => setDeletingPlace(null)}
          deleting={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          <Check size={14} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
