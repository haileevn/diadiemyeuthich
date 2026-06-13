// Trong dev: Vite proxy chuyển /api → http://localhost:3001/api
// Trong production: đặt VITE_API_URL=https://api.yourdomain.com
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const TOKEN_KEY = 'ddyt_admin_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Lỗi HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Token helpers
  getToken:   () => localStorage.getItem(TOKEN_KEY),
  saveToken:  (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  // Places (public)
  getPlaces: () => request('/places'),

  // Places (admin – cần token)
  addPlace:    (data)     => request('/places',        { method: 'POST',   body: JSON.stringify(data) }),
  editPlace:   (id, data) => request(`/places/${id}`,  { method: 'PUT',    body: JSON.stringify(data) }),
  deletePlace: (id)       => request(`/places/${id}`,  { method: 'DELETE' }),

  // Auth
  login:      (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  checkToken: ()                   => request('/auth/check'),
  setupAdmin: (username, password) => request('/auth/setup', { method: 'POST', body: JSON.stringify({ username, password }) }),
};
