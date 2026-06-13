import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw, Flame } from 'lucide-react';
import SwipeCard from './SwipeCard';
import { CATEGORIES } from '../data/places';

const FILTER_TABS = [
  { id: CATEGORIES.ALL, label: 'Tất cả', emoji: '🔥' },
  { id: CATEGORIES.FOOD, label: 'Ăn uống', emoji: '🍜' },
  { id: CATEGORIES.CAFE, label: 'Cà phê', emoji: '☕' },
  { id: CATEGORIES.FUN, label: 'Vui chơi', emoji: '🎮' },
];

export default function DiscoverScreen({ places, onSwipe, onReset, likedCount, savedCount }) {
  const [activeFilter, setActiveFilter] = useState(CATEGORIES.ALL);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [radius, setRadius] = useState(5);

  const filtered = places.filter(p =>
    (activeFilter === CATEGORIES.ALL || p.category === activeFilter) &&
    p.distance <= radius
  );

  const handleSwipe = useCallback((dir, place) => {
    onSwipe(dir, place);
  }, [onSwipe]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Flame size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-lg leading-none">Khám Phá</h1>
              <p className="text-gray-400 text-xs">Gần bạn trong {radius}km</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center relative"
          >
            <SlidersHorizontal size={18} className="text-red-500" />
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Bán kính tìm kiếm</span>
                  <span className="text-sm font-bold text-red-500">{radius} km</span>
                </div>
                <input
                  type="range" min="1" max="10" value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1km</span><span>5km</span><span>10km</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === tab.id
                  ? 'bg-red-500 text-white shadow-sm shadow-red-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative px-4 py-3">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-5xl">😢</span>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-800 text-lg">Hết địa điểm rồi!</h3>
              <p className="text-gray-400 text-sm mt-1">Bạn đã xem hết tất cả<br />địa điểm trong khu vực này</p>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-red-200 active:scale-95 transition-transform"
            >
              <RotateCcw size={16} />
              Xem lại từ đầu
            </button>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Stack preview cards */}
            {filtered.slice(1, 3).map((place, i) => (
              <div
                key={place.id}
                className="absolute inset-0 rounded-3xl bg-white shadow-lg"
                style={{
                  transform: `scale(${0.95 - i * 0.03}) translateY(${(i + 1) * 8}px)`,
                  zIndex: filtered.length - i - 2,
                }}
              />
            ))}
            {/* Active card */}
            {filtered.slice(0, 1).map((place) => (
              <SwipeCard
                key={place.id}
                place={place}
                onSwipe={handleSwipe}
                isTop={true}
                zIndex={filtered.length}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex justify-center gap-8">
        <div className="text-center">
          <div className="text-lg font-black text-red-500">{likedCount}</div>
          <div className="text-xs text-gray-400">Đã thích</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-yellow-500">{savedCount}</div>
          <div className="text-xs text-gray-400">Đã lưu</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-blue-500">{filtered.length}</div>
          <div className="text-xs text-gray-400">Còn lại</div>
        </div>
      </div>
    </div>
  );
}
