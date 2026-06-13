import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Star, Navigation, X, ChevronDown, ChevronUp, Clock, Phone } from 'lucide-react';
import { CATEGORY_META } from '../data/places';

let leafletLoaded = false;
function ensureLeafletCSS() {
  if (leafletLoaded) return;
  leafletLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  // Theme: warm filter on tiles + pulse animation for user marker
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-tile { filter: sepia(0.14) saturate(0.88) brightness(0.97); }
    .leaflet-container { background: #fdeaea; }
    @keyframes user-pulse {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(2.8); opacity: 0; }
    }
    .user-pulse-ring {
      position: absolute; inset: -6px;
      background: #EF4444; border-radius: 50%;
      animation: user-pulse 1.8s ease-out infinite;
    }
  `;
  document.head.appendChild(style);
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function formatDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function formatTime(s) {
  if (s < 60) return `${Math.round(s)} giây`;
  if (s < 3600) return `${Math.round(s / 60)} phút`;
  return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}p`;
}

// Vietnamese maneuver instructions
const VI_MANEUVER = {
  'depart': 'Xuất phát',
  'arrive': 'Đã đến nơi',
  'turn-left': 'Quẹo trái',
  'turn-right': 'Quẹo phải',
  'turn-slight left': 'Quẹo nhẹ sang trái',
  'turn-slight right': 'Quẹo nhẹ sang phải',
  'turn-sharp left': 'Quẹo gắt sang trái',
  'turn-sharp right': 'Quẹo gắt sang phải',
  'turn-uturn': 'Quay đầu xe',
  'turn-straight': 'Tiếp tục đi thẳng',
  'continue-straight': 'Tiếp tục đi thẳng',
  'continue-left': 'Tiếp tục sang trái',
  'continue-right': 'Tiếp tục sang phải',
  'continue-slight left': 'Tiếp tục nhẹ sang trái',
  'continue-slight right': 'Tiếp tục nhẹ sang phải',
  'new name-straight': 'Tiếp tục đi thẳng',
  'new name-left': 'Tiếp tục sang trái',
  'new name-right': 'Tiếp tục sang phải',
  'fork-left': 'Đi nhánh trái',
  'fork-right': 'Đi nhánh phải',
  'fork-slight left': 'Đi nhánh nhẹ sang trái',
  'fork-slight right': 'Đi nhánh nhẹ sang phải',
  'merge': 'Nhập làn đường',
  'merge-left': 'Nhập làn bên trái',
  'merge-right': 'Nhập làn bên phải',
  'on ramp': 'Lên đường lớn',
  'on ramp-left': 'Lên đường lớn bên trái',
  'on ramp-right': 'Lên đường lớn bên phải',
  'off ramp': 'Ra đường nhánh',
  'off ramp-left': 'Ra đường nhánh bên trái',
  'off ramp-right': 'Ra đường nhánh bên phải',
  'end of road-left': 'Cuối đường, rẽ trái',
  'end of road-right': 'Cuối đường, rẽ phải',
  'use lane': 'Đổi làn đường',
  'roundabout': 'Vào vòng xuyến',
  'exit roundabout': 'Ra khỏi vòng xuyến',
  'roundabout turn-left': 'Vòng xuyến: rẽ trái',
  'roundabout turn-right': 'Vòng xuyến: rẽ phải',
  'rotary': 'Vào bùng binh',
  'exit rotary': 'Ra khỏi bùng binh',
  'notification': 'Chú ý',
  'straight': 'Đi thẳng',
};

// Maneuver visual style: colored icon + arrow symbol
const MANEUVER_STYLE = {
  'depart':             { bg: '#10B981', symbol: '▶' },
  'arrive':             { bg: '#EF4444', symbol: '●' },
  'turn-left':          { bg: '#EF4444', symbol: '←' },
  'turn-right':         { bg: '#EF4444', symbol: '→' },
  'turn-slight left':   { bg: '#F59E0B', symbol: '↖' },
  'turn-slight right':  { bg: '#F59E0B', symbol: '↗' },
  'turn-sharp left':    { bg: '#DC2626', symbol: '↩' },
  'turn-sharp right':   { bg: '#DC2626', symbol: '↪' },
  'turn-uturn':         { bg: '#7C3AED', symbol: '↺' },
  'turn-straight':      { bg: '#3B82F6', symbol: '↑' },
  'continue-straight':  { bg: '#3B82F6', symbol: '↑' },
  'continue-left':      { bg: '#EF4444', symbol: '←' },
  'continue-right':     { bg: '#EF4444', symbol: '→' },
  'fork-left':          { bg: '#F59E0B', symbol: '↖' },
  'fork-right':         { bg: '#F59E0B', symbol: '↗' },
  'fork-slight left':   { bg: '#F59E0B', symbol: '↖' },
  'fork-slight right':  { bg: '#F59E0B', symbol: '↗' },
  'merge':              { bg: '#3B82F6', symbol: '↑' },
  'on ramp-left':       { bg: '#F59E0B', symbol: '↗' },
  'on ramp-right':      { bg: '#F59E0B', symbol: '↗' },
  'off ramp-left':      { bg: '#F59E0B', symbol: '↙' },
  'off ramp-right':     { bg: '#F59E0B', symbol: '↘' },
  'end of road-left':   { bg: '#EF4444', symbol: '←' },
  'end of road-right':  { bg: '#EF4444', symbol: '→' },
  'roundabout':         { bg: '#6366F1', symbol: '↻' },
  'exit roundabout':    { bg: '#6366F1', symbol: '↗' },
  'rotary':             { bg: '#6366F1', symbol: '↻' },
  'exit rotary':        { bg: '#6366F1', symbol: '↗' },
};

function getStepStyle(step) {
  const type = step?.maneuver?.type || '';
  const mod = step?.maneuver?.modifier || '';
  const combined = mod ? `${type}-${mod}` : type;
  return MANEUVER_STYLE[combined] || MANEUVER_STYLE[type] || { bg: '#3B82F6', symbol: '↑' };
}

function getViInstruction(step) {
  const type = step?.maneuver?.type || '';
  const mod = step?.maneuver?.modifier || '';
  const combined = mod ? `${type}-${mod}` : type;
  return VI_MANEUVER[combined] || VI_MANEUVER[type] || 'Tiếp tục';
}

export default function MapScreen({ places, userLocation }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const userLat = userLocation?.lat ?? 21.0285;
  const userLng = userLocation?.lng ?? 105.8542;

  // km/h từ m/s
  const speedKmh = userLocation?.speed != null && userLocation.speed >= 0
    ? Math.round(userLocation.speed * 3.6)
    : null;

  // Init map
  useEffect(() => {
    ensureLeafletCSS();
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      leafletRef.current = L.default ?? L;
      const Lf = leafletRef.current;

      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = Lf.map(mapRef.current, {
        center: [userLat, userLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
      });

      // CartoDB Voyager – ấm hơn, khớp tone đỏ/cam của app
      Lf.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      Lf.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  // Cập nhật marker vị trí người dùng (đỏ + pulse)
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const Lf = leafletRef.current;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) userMarkerRef.current.remove();

    const userIcon = Lf.divIcon({
      className: '',
      html: `<div style="position:relative;width:20px;height:20px;">
        <div class="user-pulse-ring"></div>
        <div style="position:absolute;top:2px;left:2px;width:16px;height:16px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(239,68,68,0.65);"></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    userMarkerRef.current = Lf.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>📍 Vị trí của bạn</b>');
  }, [mapReady, userLat, userLng]);

  // Markers địa điểm
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const Lf = leafletRef.current;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = filterCat === 'all' ? places : places.filter(p => p.category === filterCat);

    filtered.forEach((place) => {
      const meta = CATEGORY_META[place.category];
      const isSelected = selected?.id === place.id;
      const icon = Lf.divIcon({
        className: '',
        html: `<div style="
          background:${meta.color};
          color:white;
          border:2px solid white;
          border-radius:20px 20px 20px 4px;
          padding:4px 8px;
          font-size:11px;
          font-weight:700;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition:transform .2s;
          max-width:120px;overflow:hidden;text-overflow:ellipsis;
        ">${meta.emoji} ${place.name.split(' ').slice(0, 2).join(' ')}</div>`,
        iconAnchor: [0, 0],
      });

      const marker = Lf.marker([place.lat, place.lng], { icon })
        .addTo(map)
        .on('click', () => setSelected(place));

      markersRef.current.push(marker);
    });
  }, [mapReady, places, filterCat, selected]);

  // Pan đến địa điểm được chọn
  useEffect(() => {
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selected.lat, selected.lng], 15, { duration: 0.8 });
    }
  }, [selected]);

  // Tính đường qua OSRM
  const getRoute = useCallback(async (place) => {
    setRouteLoading(true);
    setRouteError(null);
    setRoute(null);
    setShowSteps(false);

    try {
      const url = `${OSRM_BASE}/${userLng},${userLat};${place.lng},${place.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes?.[0]) {
        throw new Error('Không tìm được tuyến đường');
      }

      const r = data.routes[0];
      setRoute({
        distance: r.distance,
        duration: r.duration,
        geometry: r.geometry,
        steps: r.legs[0]?.steps || [],
      });

      if (leafletRef.current && mapInstanceRef.current) {
        const Lf = leafletRef.current;
        if (routeLayerRef.current) routeLayerRef.current.remove();

        // Vẽ 2 lớp: viền trắng + đường đỏ để nổi bật trên bản đồ
        routeLayerRef.current = Lf.layerGroup([
          Lf.geoJSON(r.geometry, {
            style: { color: 'white', weight: 9, opacity: 0.65, lineCap: 'round', lineJoin: 'round' },
          }),
          Lf.geoJSON(r.geometry, {
            style: { color: '#EF4444', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' },
          }),
        ]).addTo(mapInstanceRef.current);

        const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        mapInstanceRef.current.fitBounds(Lf.latLngBounds(coords), { padding: [40, 40] });
      }
    } catch (e) {
      setRouteError(e.message || 'Lỗi kết nối. Kiểm tra mạng và thử lại.');
    } finally {
      setRouteLoading(false);
    }
  }, [userLat, userLng]);

  const clearRoute = useCallback(() => {
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }
    setRoute(null);
    setRouteError(null);
    setShowSteps(false);
  }, []);

  const recenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLat, userLng], 14, { duration: 0.8 });
    }
  };

  const filtered = filterCat === 'all' ? places : places.filter(p => p.category === filterCat);

  // Step tiếp theo (bỏ qua depart, dùng để preview)
  const nextStep = route?.steps?.find(s => s.maneuver?.type !== 'depart' && s.maneuver?.type !== 'arrive');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-3 shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center justify-between pt-4 mb-3">
          <div>
            <h1 className="font-black text-gray-900 text-xl leading-none">Bản đồ</h1>
            <p className="text-gray-400 text-xs mt-0.5">{filtered.length} địa điểm quanh bạn</p>
          </div>
          <button
            onClick={recenter}
            className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"
          >
            <Navigation size={17} className="text-red-500" />
          </button>
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[{ id: 'all', label: 'Tất cả', emoji: '🗺️' },
            ...Object.entries(CATEGORY_META).map(([id, m]) => ({ id, label: m.label, emoji: m.emoji }))
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCat(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterCat === tab.id ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="relative flex-1 min-h-0">
        <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />

        {/* Hiển thị tốc độ – góc trên bên trái */}
        <div className="absolute top-3 left-3 z-40 bg-white/92 backdrop-blur-sm rounded-2xl shadow-lg border border-red-100 px-3 py-2 flex flex-col items-center min-w-[56px]">
          <span className="text-2xl font-black text-gray-900 leading-none">
            {speedKmh !== null ? speedKmh : '—'}
          </span>
          <span className="text-[10px] font-semibold text-red-400 mt-0.5 uppercase tracking-wide">km/h</span>
        </div>

        {/* Route info overlay */}
        {(route || routeLoading || routeError) && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[60%] flex flex-col">
            {/* Route header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                  <Navigation size={15} className="text-red-500" />
                </div>
                <div>
                  {routeLoading && <p className="text-sm font-semibold text-gray-700">Đang tính đường...</p>}
                  {routeError && <p className="text-sm font-semibold text-red-500">{routeError}</p>}
                  {route && (
                    <>
                      <p className="text-sm font-black text-gray-900">
                        {formatDist(route.distance)} · {formatTime(route.duration)}
                      </p>
                      <p className="text-xs text-gray-400">Lái xe · {selected?.name}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {route && (
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="text-xs text-red-500 font-semibold flex items-center gap-0.5"
                  >
                    {showSteps ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    {showSteps ? 'Ẩn' : 'Chỉ tiết'}
                  </button>
                )}
                <button onClick={clearRoute} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview bước tiếp theo khi chưa mở danh sách chi tiết */}
            {route && !showSteps && nextStep && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border-b border-red-100 flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl font-bold"
                  style={{ background: getStepStyle(nextStep).bg }}
                >
                  {getStepStyle(nextStep).symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {getViInstruction(nextStep)}
                    {nextStep.name ? <span className="text-red-600"> · {nextStep.name}</span> : null}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDist(nextStep.distance)} nữa</p>
                </div>
              </div>
            )}

            {/* Danh sách bước chi tiết */}
            {route && showSteps && (
              <div className="overflow-y-auto flex-1">
                {route.steps.map((step, i) => {
                  const style = getStepStyle(step);
                  const instruction = getViInstruction(step);
                  const isLast = i === route.steps.length - 1;
                  if (isLast && step.maneuver?.type === 'arrive') {
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 bg-red-50">
                        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg">🏁</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-600">{selected?.name}</p>
                          <p className="text-xs text-gray-500">{selected?.address}</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      {/* Icon hướng đi */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                        style={{ background: style.bg, fontSize: '20px' }}
                      >
                        {style.symbol}
                      </div>

                      {/* Nội dung bước */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {instruction}
                          {step.name ? (
                            <> vào <span className="text-red-500 font-bold">{step.name}</span></>
                          ) : null}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-gray-700">{formatDist(step.distance)}</span>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-400">{formatTime(step.duration)}</span>
                        </div>
                      </div>

                      {/* Số thứ tự bước */}
                      <span className="text-xs text-gray-300 font-medium flex-shrink-0">{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mở trong Google Maps */}
            {selected && !routeLoading && (
              <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/${userLat},${userLng}/${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                >
                  <Navigation size={15} />
                  Mở trong Google Maps
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thẻ địa điểm được chọn */}
      {selected && !route && !routeLoading && !routeError && (
        <div className="bg-white border-t border-gray-100 shadow-lg flex-shrink-0 z-10">
          <div className="flex gap-3 p-3">
            <img
              src={selected.images[0]}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              alt={selected.name}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate text-sm">{selected.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">{selected.rating}</span>
                <span className="text-gray-300 text-xs">·</span>
                <MapPin size={11} className="text-red-400" />
                <span className="text-xs text-red-500 font-medium">{selected.distance} km</span>
                <span className="text-gray-300 text-xs">·</span>
                <Clock size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">{selected.hours}</span>
              </div>
              <p className="text-gray-400 text-xs mt-1 truncate">{selected.address}</p>
            </div>
            <button onClick={() => setSelected(null)} className="flex-shrink-0 self-start">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2 px-3 pb-3">
            <a
              href={`tel:${selected.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs font-semibold"
            >
              <Phone size={13} /> Gọi ngay
            </a>
            <button
              onClick={() => getRoute(selected)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 rounded-xl text-xs font-bold shadow-sm shadow-red-200"
            >
              <Navigation size={13} /> Chỉ đường
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
