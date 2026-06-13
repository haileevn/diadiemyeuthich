import { useState } from 'react';
import { MapPin, Star, Heart, Bookmark, Trash2, Phone } from 'lucide-react';

const CATEGORY_LABELS = { food: '🍜', cafe: '☕', fun: '🎮' };

function PlaceCard({ place, onRemove, type }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-98 transition-transform">
      <div className="relative" onClick={() => setShowDetail(!showDetail)}>
        <img src={place.images[0]} alt={place.name} className="w-full h-36 object-cover" />
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(place.id); }}
            className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm"
          >
            <Trash2 size={13} className="text-gray-500" />
          </button>
        </div>
        <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">
          {CATEGORY_LABELS[place.category]}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-bold text-sm leading-tight truncate">{place.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs">{place.rating}</span>
            <span className="text-white/50 text-xs">• {place.distance}km</span>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="p-3 border-t border-gray-100 space-y-1.5">
          <p className="text-gray-500 text-xs leading-relaxed">{place.description}</p>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <MapPin size={11} className="text-red-400 flex-shrink-0" />
            <span className="truncate">{place.address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Phone size={11} className="text-red-400" />
            <a href={`tel:${place.phone}`} className="text-red-500 font-medium">{place.phone}</a>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {place.tags.map(t => (
              <span key={t} className="bg-red-50 text-red-500 text-xs px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LikedScreen({ liked, saved, onRemoveLiked, onRemoveSaved }) {
  const [activeTab, setActiveTab] = useState('liked');
  const items = activeTab === 'liked' ? liked : saved;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-safe-top pb-0 shadow-sm">
        <h1 className="font-black text-gray-900 text-xl pt-4">Danh sách của tôi</h1>
        <div className="flex mt-3 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'liked' ? 'text-red-500 border-red-500' : 'text-gray-400 border-transparent'
            }`}
          >
            <Heart size={15} className={activeTab === 'liked' ? 'fill-red-500 text-red-500' : ''} />
            Đã thích ({liked.length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'saved' ? 'text-yellow-500 border-yellow-500' : 'text-gray-400 border-transparent'
            }`}
          >
            <Bookmark size={15} className={activeTab === 'saved' ? 'fill-yellow-500 text-yellow-500' : ''} />
            Đã lưu ({saved.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
            <span className="text-6xl">{activeTab === 'liked' ? '💔' : '📋'}</span>
            <div className="text-center">
              <h3 className="font-bold text-gray-700">Chưa có gì ở đây</h3>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === 'liked'
                  ? 'Vuốt phải để thích một địa điểm!'
                  : 'Nhấn ★ để lưu địa điểm!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                type={activeTab}
                onRemove={activeTab === 'liked' ? onRemoveLiked : onRemoveSaved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
