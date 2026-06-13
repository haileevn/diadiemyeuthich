import { useState, useCallback } from 'react';
import {
  Calendar, Plus, MapPin, Clock, ChevronDown, ChevronUp,
  Trash2, Copy, Check, X, ArrowRight, ArrowLeft, Sparkles,
  Coffee, Utensils, Gamepad2, Navigation,
} from 'lucide-react';
import { CATEGORY_META } from '../data/places';

const STORAGE_KEY = 'ddyt_itinerary_v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateVN(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return `${dow}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Gán khung giờ theo danh mục và vị trí trong ngày
const SLOTS = { cafe: ['08:00', '10:00'], food: ['12:00', '18:30'], fun: ['14:00', '16:00'] };
const CAT_ORDER = { cafe: 0, food: 1, fun: 2 };

function generateSchedule(places, days, startDate) {
  const sorted = [...places].sort((a, b) => {
    const cd = (CAT_ORDER[a.category] ?? 3) - (CAT_ORDER[b.category] ?? 3);
    return cd !== 0 ? cd : (a.distance ?? 99) - (b.distance ?? 99);
  });

  const daySlots = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    date: addDays(startDate, i),
    places: [],
  }));

  // Phân bổ xoay vòng qua các ngày
  sorted.forEach((p, i) => daySlots[i % days].places.push({ ...p }));

  daySlots.forEach(ds => {
    ds.places.sort((a, b) => (CAT_ORDER[a.category] ?? 3) - (CAT_ORDER[b.category] ?? 3));
    const cnt = {};
    ds.places.forEach(p => {
      const slots = SLOTS[p.category] || ['09:00'];
      cnt[p.category] = cnt[p.category] ?? 0;
      p.time = slots[cnt[p.category]++ % slots.length];
    });
    ds.places.sort((a, b) => a.time.localeCompare(b.time));
  });

  return daySlots;
}

function buildShareText(schedule) {
  const lines = ['📅 LỊCH TRÌNH DU LỊCH', '─'.repeat(28)];
  schedule.forEach(({ day, date, places }) => {
    lines.push('', `📍 NGÀY ${day}  •  ${formatDateVN(date)}`);
    places.forEach(p => {
      const emoji = CATEGORY_META[p.category]?.emoji ?? '📌';
      lines.push(`  ${p.time}  ${emoji} ${p.name}`);
      lines.push(`           ${p.address}`);
    });
  });
  return lines.join('\n');
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlaceCheckCard({ place, checked, onToggle }) {
  const meta = CATEGORY_META[place.category];
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
        checked ? 'border-red-400 shadow-md shadow-red-100' : 'border-gray-200'
      }`}
    >
      <img src={place.images[0]} alt={place.name} className="w-full h-20 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      {/* Checkbox */}
      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        checked ? 'bg-red-500 border-red-500' : 'bg-white/80 border-white'
      }`}>
        {checked && <Check size={11} className="text-white" />}
      </div>
      {/* Category badge */}
      <div className="absolute top-2 left-2 text-sm">{meta?.emoji}</div>
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white font-bold text-xs leading-tight truncate">{place.name}</p>
        <p className="text-white/70 text-xs">{place.distance}km</p>
      </div>
    </button>
  );
}

function TimelineItem({ place, editMode, onRemove, isLast }) {
  const meta = CATEGORY_META[place.category];
  const catColors = { cafe: '#F59E0B', food: '#EF4444', fun: '#8B5CF6' };
  const dotColor = catColors[place.category] || '#6B7280';

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
        <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0 mt-0.5"
          style={{ background: dotColor }} />
        {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ background: '#E5E7EB', minHeight: 24 }} />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-gray-400 tabular-nums">{place.time}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: meta?.bg, color: dotColor }}>
                {meta?.emoji} {meta?.label}
              </span>
            </div>
            <p className="font-bold text-gray-900 text-sm leading-snug">{place.name}</p>
            <div className="flex items-center gap-1 mt-0.5 text-gray-400 text-xs">
              <MapPin size={9} className="flex-shrink-0" />
              <span className="truncate">{place.address}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{place.distance}km</span>
              <span className="text-gray-200 text-xs">·</span>
              <span className="text-xs text-gray-400">{place.hours}</span>
            </div>
          </div>

          {editMode && (
            <button onClick={() => onRemove(place.id)}
              className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <X size={13} className="text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DayCard({ dayData, dayIndex, editMode, onRemovePlace, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const total = dayData.places.length;

  const catCounts = dayData.places.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Day header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex flex-col items-center justify-center shadow-sm shadow-red-200 flex-shrink-0">
            <span className="text-white font-black text-sm leading-none">{dayData.day}</span>
            <span className="text-white/80 text-[9px] leading-none uppercase tracking-wide">ngày</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm leading-none">{formatDateVN(dayData.date)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {Object.entries(catCounts).map(([cat, n]) => (
                <span key={cat} className="text-xs">{CATEGORY_META[cat]?.emoji} ×{n}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">{total} điểm</span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Timeline */}
      {open && (
        <div className="px-4 pb-2 pt-1 border-t border-gray-50">
          {total === 0 ? (
            <p className="text-center text-gray-400 text-sm py-3">Ngày trống</p>
          ) : dayData.places.map((place, i) => (
            <TimelineItem
              key={place.id}
              place={place}
              editMode={editMode}
              onRemove={(id) => onRemovePlace(dayIndex, id)}
              isLast={i === dayData.places.length - 1}
            />
          ))}

          {/* Navigate on map */}
          {!editMode && total > 0 && (
            <a
              href={`https://www.google.com/maps/dir/${dayData.places.map(p => `${p.lat},${p.lng}`).join('/')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 mb-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold"
            >
              <Navigation size={12} /> Mở cả ngày trong Google Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

function WizardOverlay({ step, candidates, selected, setSelected, days, setDays, startDate, setStartDate, onNext, onBack, onGenerate }) {
  const toggleAll = () => {
    if (selected.size === candidates.length) setSelected(new Set());
    else setSelected(new Set(candidates.map(p => p.id)));
  };

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const perDay = selectedCount > 0 ? Math.ceil(selectedCount / days) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      <div className="bg-white w-full rounded-t-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Wizard header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={onBack} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {step === 1 ? <X size={15} className="text-gray-500" /> : <ArrowLeft size={15} className="text-gray-500" />}
          </button>
          <div className="text-center">
            <p className="font-black text-gray-900 text-sm">
              {step === 1 ? 'Chọn địa điểm' : 'Cài đặt lịch trình'}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-6 bg-red-500' : 'w-2 bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="w-8" />
        </div>

        {/* Step 1: Chọn địa điểm */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 flex-shrink-0">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{selectedCount}</span>/{candidates.length} địa điểm đã chọn
              </p>
              <button onClick={toggleAll} className="text-xs text-red-500 font-semibold">
                {selected.size === candidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-2 gap-2.5">
                {candidates.map(p => (
                  <PlaceCheckCard
                    key={p.id}
                    place={p}
                    checked={selected.has(p.id)}
                    onToggle={() => toggle(p.id)}
                  />
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={onNext}
                disabled={selectedCount === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm shadow-red-200"
              >
                Tiếp tục <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {/* Step 2: Cài đặt */}
        {step === 2 && (
          <>
            <div className="overflow-y-auto flex-1 p-4 space-y-5">
              {/* Days */}
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-2">Số ngày du lịch</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setDays(n)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        days === n
                          ? 'bg-gradient-to-b from-red-500 to-rose-600 text-white shadow-sm shadow-red-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-2">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr()}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-red-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Preview summary */}
              <div className="bg-red-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-red-500" />
                  <span className="font-bold text-gray-900 text-sm">Tóm tắt lịch trình</span>
                </div>
                {[
                  ['📍 Tổng địa điểm', `${selectedCount} nơi`],
                  ['📅 Số ngày', `${days} ngày`],
                  ['🗓️ Từ ngày', formatDateVN(startDate)],
                  ['🗓️ Đến ngày', formatDateVN(addDays(startDate, days - 1))],
                  ['⏱️ Trung bình', `~${perDay} điểm/ngày`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              {/* Category breakdown */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Khung giờ tự động</p>
                <div className="space-y-1.5">
                  {[
                    { cat: 'cafe', icon: Coffee, times: '08:00 · 10:00', label: 'Cà phê / buổi sáng' },
                    { cat: 'food', icon: Utensils, times: '12:00 · 18:30', label: 'Ăn uống / trưa & tối' },
                    { cat: 'fun',  icon: Gamepad2, times: '14:00 · 16:00', label: 'Giải trí / buổi chiều' },
                  ].map(({ cat, icon: Icon, times, label }) => {
                    const meta = CATEGORY_META[cat];
                    return (
                      <div key={cat} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{ background: meta.bg }}>
                        <Icon size={14} style={{ color: meta.color }} />
                        <span className="flex-1 text-xs font-medium" style={{ color: meta.color }}>{label}</span>
                        <span className="text-xs font-bold text-gray-500">{times}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={onBack}
                className="flex-none px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm flex items-center gap-1.5">
                <ArrowLeft size={15} /> Quay lại
              </button>
              <button onClick={onGenerate}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-red-200">
                <Sparkles size={15} /> Tạo lịch trình
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Landing (có địa điểm nhưng chưa tạo lịch) ──────────────────────────────

function LandingView({ candidates, onStart }) {
  return (
    <div className="p-4 space-y-4">
      {/* CTA hero */}
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Calendar size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-lg leading-snug">Tạo lịch trình du lịch</h2>
            <p className="text-white/80 text-xs mt-1 leading-relaxed">
              AI tự động sắp xếp {candidates.length} địa điểm yêu thích của bạn thành lịch trình theo ngày — cafe buổi sáng, ăn trưa, vui chiều, ăn tối!
            </p>
          </div>
        </div>
        <button
          onClick={onStart}
          className="mt-4 w-full bg-white text-red-500 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Sparkles size={15} /> Tạo lịch trình ngay
        </button>
      </div>

      {/* Preview places */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Địa điểm của bạn ({candidates.length})
        </p>
        <div className="grid grid-cols-3 gap-2">
          {candidates.slice(0, 6).map(p => {
            const meta = CATEGORY_META[p.category];
            return (
              <div key={p.id} className="rounded-xl overflow-hidden relative aspect-square">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                  <p className="text-white text-xs font-bold leading-tight truncate">{p.name.split(' ').slice(0, 2).join(' ')}</p>
                </div>
                <div className="absolute top-1.5 left-1.5 text-sm">{meta?.emoji}</div>
              </div>
            );
          })}
          {candidates.length > 6 && (
            <div className="rounded-xl bg-red-50 flex items-center justify-center aspect-square">
              <div className="text-center">
                <p className="text-red-500 font-black text-lg">+{candidates.length - 6}</p>
                <p className="text-red-400 text-xs">nơi nữa</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cách hoạt động</p>
        <div className="space-y-2.5">
          {[
            { n: '1', text: 'Chọn địa điểm muốn ghé thăm', color: '#EF4444' },
            { n: '2', text: 'Chọn số ngày và ngày bắt đầu', color: '#F59E0B' },
            { n: '3', text: 'Lịch trình được tạo tự động', color: '#10B981' },
          ].map(({ n, text, color }) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ background: color }}>
                {n}
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ItineraryScreen chính ────────────────────────────────────────────────────

export default function ItineraryScreen({ liked, saved }) {
  // Gộp liked + saved, không trùng id, liked ưu tiên trước
  const allCandidates = [
    ...liked,
    ...saved.filter(s => !liked.some(l => l.id === s.id)),
  ];

  const [schedule, setSchedule] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  });
  const [building, setBuilding]     = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selected, setSelected]     = useState(new Set());
  const [days, setDays]             = useState(3);
  const [startDate, setStartDate]   = useState(todayStr());
  const [editMode, setEditMode]     = useState(false);
  const [copied, setCopied]         = useState(false);

  const saveSchedule = useCallback((s) => {
    setSchedule(s);
    try {
      if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const openWizard = () => {
    setSelected(new Set(allCandidates.map(p => p.id)));
    setDays(Math.min(7, Math.max(1, Math.ceil(allCandidates.length / 3))));
    setStartDate(todayStr());
    setWizardStep(1);
    setBuilding(true);
    setEditMode(false);
  };

  const handleGenerate = () => {
    const places = allCandidates.filter(p => selected.has(p.id));
    if (!places.length) return;
    saveSchedule(generateSchedule(places, days, startDate));
    setBuilding(false);
  };

  const removePlace = useCallback((dayIdx, placeId) => {
    const next = schedule
      .map((d, i) => i === dayIdx ? { ...d, places: d.places.filter(p => p.id !== placeId) } : d)
      .filter(d => d.places.length > 0);
    saveSchedule(next.length ? next : null);
    if (!next.length) setEditMode(false);
  }, [schedule, saveSchedule]);

  const handleCopy = async () => {
    if (!schedule) return;
    try { await navigator.clipboard.writeText(buildShareText(schedule)); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPlaces = schedule ? schedule.reduce((n, d) => n + d.places.length, 0) : 0;

  // Chưa có địa điểm yêu thích
  if (allCandidates.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white px-4 pt-safe-top pb-3 shadow-sm flex-shrink-0">
          <h1 className="font-black text-gray-900 text-xl pt-4">Lịch trình</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-6xl">📅</span>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Chưa có địa điểm yêu thích</h3>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Vuốt phải để thích địa điểm, rồi quay lại đây để tạo lịch trình du lịch tự động!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-3 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="font-black text-gray-900 text-xl leading-none">Lịch trình</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {schedule
                ? `${schedule.length} ngày · ${totalPlaces} địa điểm`
                : `${allCandidates.length} địa điểm yêu thích`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {schedule && (
              <>
                <button onClick={handleCopy} title="Sao chép lịch trình"
                  className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  {copied
                    ? <Check size={15} className="text-green-500" />
                    : <Copy size={15} className="text-gray-500" />}
                </button>
                <button
                  onClick={() => setEditMode(v => !v)}
                  title={editMode ? 'Xong' : 'Xóa địa điểm'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${editMode ? 'bg-red-100' : 'bg-gray-100'}`}
                >
                  {editMode
                    ? <Check size={15} className="text-red-500" />
                    : <Trash2 size={15} className="text-gray-500" />}
                </button>
              </>
            )}
            <button onClick={openWizard}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm shadow-red-200">
              <Plus size={14} />
              {schedule ? 'Tạo mới' : 'Tạo lịch'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <Trash2 size={13} className="text-red-500" />
          <p className="text-red-600 text-xs font-medium flex-1">Nhấn × để xóa địa điểm khỏi lịch</p>
          <button onClick={() => setEditMode(false)} className="text-red-500 text-xs font-bold">Xong</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!schedule ? (
          <LandingView candidates={allCandidates} onStart={openWizard} />
        ) : (
          <div className="p-4 space-y-3 pb-6">
            {schedule.map((dayData, i) => (
              <DayCard
                key={dayData.day}
                dayData={dayData}
                dayIndex={i}
                editMode={editMode}
                onRemovePlace={removePlace}
                defaultOpen={true}
              />
            ))}
            <button onClick={openWizard}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-medium flex items-center justify-center gap-2 mt-2">
              <RefreshCw size={14} /> Tạo lịch trình mới
            </button>
          </div>
        )}
      </div>

      {/* Wizard overlay */}
      {building && (
        <WizardOverlay
          step={wizardStep}
          candidates={allCandidates}
          selected={selected}
          setSelected={setSelected}
          days={days}
          setDays={setDays}
          startDate={startDate}
          setStartDate={setStartDate}
          onNext={() => setWizardStep(2)}
          onBack={() => wizardStep === 1 ? setBuilding(false) : setWizardStep(1)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
