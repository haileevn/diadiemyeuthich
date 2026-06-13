import { useState, useEffect, useRef } from 'react';

// Haversine: khoảng cách giữa 2 tọa độ (mét)
function haversineDist(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null); // { lat, lng, timestamp }

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      setLoading(false);
      setLocation({ lat: 21.0285, lng: 105.8542, speed: null, heading: null });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed, heading, accuracy } = pos.coords;
        const ts = pos.timestamp;

        // Ưu tiên speed từ GPS; fallback: tính từ delta vị trí
        let computedSpeed = speed != null && speed >= 0 ? speed : null;

        if (computedSpeed === null && prevRef.current) {
          const { lat: pLat, lng: pLng, timestamp: pTs } = prevRef.current;
          const dt = (ts - pTs) / 1000; // giây
          // Chỉ tính khi khoảng cách thời gian hợp lý (0.5s – 8s)
          if (dt >= 0.5 && dt <= 8) {
            const dist = haversineDist(pLat, pLng, lat, lng);
            computedSpeed = dist / dt; // m/s
          }
        }

        prevRef.current = { lat, lng, timestamp: ts };

        setLocation({ lat, lng, speed: computedSpeed, heading, accuracy });
        setLoading(false);
      },
      () => {
        setLocation({ lat: 21.0285, lng: 105.8542, speed: null, heading: null });
        setError('Không thể lấy vị trí, dùng vị trí mặc định (Hà Nội)');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // không dùng cache, luôn lấy GPS mới nhất
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, loading };
}
