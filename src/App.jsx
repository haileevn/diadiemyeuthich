import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DiscoverScreen from './components/DiscoverScreen';
import LikedScreen from './components/LikedScreen';
import MapScreen from './components/MapScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminScreen from './components/AdminScreen';
import ItineraryScreen from './components/ItineraryScreen';
import BottomNav from './components/BottomNav';
import { DEFAULT_PLACES } from './data/places';
import { api } from './api';
import { useGeolocation } from './hooks/useGeolocation';

export default function App() {
  const [tab, setTab]           = useState('discover');
  const [allPlaces, setAllPlaces] = useState([]);
  const [queue, setQueue]       = useState([]);
  const [liked, setLiked]       = useState([]);
  const [saved, setSaved]       = useState([]);
  const [viewed, setViewed]     = useState(0);
  const [placesLoading, setPlacesLoading] = useState(true);
  const initializedRef = useRef(false);
  const { location } = useGeolocation();

  // Tải địa điểm từ API; fallback về dữ liệu mặc định nếu API chưa bật
  const fetchPlaces = useCallback(async (isRefresh = false) => {
    try {
      const data = await api.getPlaces();
      setAllPlaces(data);
      if (!isRefresh) {
        setQueue(data);
        initializedRef.current = true;
      }
    } catch {
      // API chưa sẵn sàng → dùng dữ liệu local làm fallback
      if (!initializedRef.current) {
        setAllPlaces(DEFAULT_PLACES);
        setQueue(DEFAULT_PLACES);
        initializedRef.current = true;
      }
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlaces(false); }, [fetchPlaces]);

  const handleSwipe = useCallback((dir, place) => {
    setViewed(v => v + 1);
    setQueue(q => q.filter(p => p.id !== place.id));
    if (dir === 'right') {
      setLiked(prev => prev.some(p => p.id === place.id) ? prev : [place, ...prev]);
    } else if (dir === 'up') {
      setSaved(prev => prev.some(p => p.id === place.id) ? prev : [place, ...prev]);
    }
  }, []);

  const handleReset = useCallback(() => {
    setQueue(allPlaces);
    setViewed(0);
  }, [allPlaces]);

  // AdminScreen gọi callback này sau khi thêm/sửa/xóa để đồng bộ dữ liệu
  const handleRefresh = useCallback(() => fetchPlaces(true), [fetchPlaces]);

  const tabs = {
    discover: (
      <DiscoverScreen
        places={queue}
        onSwipe={handleSwipe}
        onReset={handleReset}
        likedCount={liked.length}
        savedCount={saved.length}
        loading={placesLoading}
      />
    ),
    liked: (
      <LikedScreen
        liked={liked}
        saved={saved}
        onRemoveLiked={(id) => setLiked(prev => prev.filter(p => p.id !== id))}
        onRemoveSaved={(id) => setSaved(prev => prev.filter(p => p.id !== id))}
      />
    ),
    map:       <MapScreen places={allPlaces} userLocation={location} />,
    itinerary: <ItineraryScreen liked={liked} saved={saved} />,
    admin:     <AdminScreen places={allPlaces} onRefresh={handleRefresh} />,
    profile: (
      <ProfileScreen
        stats={{ liked: liked.length, saved: saved.length, viewed }}
        onReset={handleReset}
      />
    ),
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {tabs[tab]}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav active={tab} onChange={setTab} likedCount={liked.length} />
    </div>
  );
}
