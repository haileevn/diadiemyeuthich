import { useState } from 'react';
import { User, MapPin, Heart, Star, Settings, Bell, Shield, Info, ChevronRight, RotateCcw, Bookmark } from 'lucide-react';

export default function ProfileScreen({ stats, onReset }) {
  const [notifications, setNotifications] = useState(true);
  const [radius, setRadius] = useState(5);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-600 to-rose-500 px-4 pt-safe-top pb-8">
        <h1 className="font-black text-white text-xl pt-4 mb-6">Hồ sơ</h1>
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
            <User size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Khách</h2>
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin size={12} />
              <span>Hà Nội, Việt Nam</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-md p-4 grid grid-cols-3 gap-2">
        <div className="text-center p-2">
          <div className="text-2xl font-black text-red-500">{stats.liked}</div>
          <div className="text-xs text-gray-400 mt-0.5">Đã thích</div>
          <Heart size={14} className="text-red-300 mx-auto mt-1" />
        </div>
        <div className="text-center p-2 border-x border-gray-100">
          <div className="text-2xl font-black text-yellow-500">{stats.saved}</div>
          <div className="text-xs text-gray-400 mt-0.5">Đã lưu</div>
          <Bookmark size={14} className="text-yellow-300 mx-auto mt-1" />
        </div>
        <div className="text-center p-2">
          <div className="text-2xl font-black text-blue-500">{stats.viewed}</div>
          <div className="text-xs text-gray-400 mt-0.5">Đã xem</div>
          <Star size={14} className="text-blue-300 mx-auto mt-1" />
        </div>
      </div>

      {/* Settings sections */}
      <div className="px-4 mt-4 space-y-3 pb-6">
        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Tùy chỉnh tìm kiếm</h3>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-red-500" />
                <span className="text-sm text-gray-700">Bán kính tìm kiếm</span>
              </div>
              <span className="text-sm font-bold text-red-500">{radius} km</span>
            </div>
            <input
              type="range" min="1" max="10" value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-red-500 mt-1"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>1km</span><span>5km</span><span>10km</span>
            </div>
          </div>
        </div>

        {/* App settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Bell size={16} className="text-red-500" />
              </div>
              <span className="text-sm text-gray-700">Thông báo</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button className="w-full flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Shield size={16} className="text-red-500" />
              </div>
              <span className="text-sm text-gray-700">Quyền riêng tư</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Info size={16} className="text-red-500" />
              </div>
              <span className="text-sm text-gray-700">Về ứng dụng</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-red-200 active:scale-98 transition-transform"
        >
          <RotateCcw size={16} />
          Reset & Khám phá lại
        </button>

        <p className="text-center text-gray-300 text-xs">Địa điểm yêu thích v1.0 • Made with ❤️</p>
      </div>
    </div>
  );
}
