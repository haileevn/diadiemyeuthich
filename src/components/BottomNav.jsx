import { Flame, Heart, Map, User, Settings2, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'discover',   label: 'Khám phá', Icon: Flame },
  { id: 'liked',      label: 'Thích',    Icon: Heart },
  { id: 'map',        label: 'Bản đồ',   Icon: Map },
  { id: 'itinerary',  label: 'Lịch',     Icon: CalendarDays },
  { id: 'admin',      label: 'Quản lý',  Icon: Settings2 },
  { id: 'profile',    label: 'Hồ sơ',    Icon: User },
];

export default function BottomNav({ active, onChange, likedCount }) {
  return (
    <nav className="bg-white border-t border-gray-100 flex items-stretch pb-safe-bottom shadow-lg shadow-black/5 flex-shrink-0">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center justify-center py-2 relative min-w-0"
          >
            <div className="relative">
              <Icon
                size={20}
                className={`transition-colors ${isActive ? 'text-red-500' : 'text-gray-400'}`}
                fill={isActive && id === 'liked' ? '#EF4444' : 'none'}
              />
              {id === 'liked' && likedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                  {likedCount > 9 ? '9+' : likedCount}
                </span>
              )}
            </div>
            <span className={`text-xs mt-0.5 font-medium transition-colors truncate w-full text-center px-0.5 ${isActive ? 'text-red-500' : 'text-gray-400'}`}>
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-500 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
