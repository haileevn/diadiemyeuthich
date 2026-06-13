import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { MapPin, Star, Clock, Phone, X, Heart, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

const PRICE_LABELS = { '$': 'Rẻ', '$$': 'Vừa', '$$$': 'Cao cấp' };
const CATEGORY_LABELS = { food: '🍜 Ăn uống', cafe: '☕ Cà phê', fun: '🎮 Vui chơi' };

export default function SwipeCard({ place, onSwipe, isTop, zIndex }) {
  const cardRef = useRef(null);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const [expanded, setExpanded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const handleDragEnd = async (_, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('right', place);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('left', place);
    } else {
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleLike = async () => {
    await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
    onSwipe('right', place);
  };

  const handleNope = async () => {
    await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
    onSwipe('left', place);
  };

  const handleSave = async () => {
    await controls.start({ y: -600, opacity: 0, transition: { duration: 0.3 } });
    onSwipe('up', place);
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, zIndex }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={controls}
      whileTap={{ scale: 1.02 }}
    >
      {/* Like / Nope indicators */}
      <motion.div
        className="absolute top-8 left-6 z-10 border-4 border-green-500 rounded-xl px-4 py-2 rotate-[-15deg]"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-green-500 font-black text-2xl tracking-widest">THÍCH!</span>
      </motion.div>
      <motion.div
        className="absolute top-8 right-6 z-10 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg]"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-red-500 font-black text-2xl tracking-widest">BỎ QUA</span>
      </motion.div>

      {/* Card */}
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white flex flex-col select-none">
        {/* Image */}
        <div className="relative flex-shrink-0" style={{ height: '58%' }}>
          <img
            src={place.images[imgIndex]}
            alt={place.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Image dots */}
          {place.images.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
              {place.images.map((_, i) => (
                <button
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'}`}
                  onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                />
              ))}
            </div>
          )}
          {/* Image tap zones */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full" onClick={() => setImgIndex(Math.max(0, imgIndex - 1))} />
            <div className="w-1/2 h-full" onClick={() => setImgIndex(Math.min(place.images.length - 1, imgIndex + 1))} />
          </div>
          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            {CATEGORY_LABELS[place.category]}
          </div>
          {/* Distance badge */}
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <MapPin size={12} />
            {place.distance} km
          </div>
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Name on image */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-xl leading-tight drop-shadow-lg">{place.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white text-sm font-semibold">{place.rating}</span>
                <span className="text-white/70 text-xs">({place.reviews.toLocaleString()})</span>
              </div>
              <span className="text-white/50">•</span>
              <span className="text-white/90 text-sm font-medium">{place.price} · {PRICE_LABELS[place.price]}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-2">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {place.tags.map((tag) => (
              <span key={tag} className="bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full border border-red-100">
                {tag}
              </span>
            ))}
          </div>
          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{place.description}</p>
          {/* Details toggle */}
          <button
            className="flex items-center gap-1 text-red-500 text-xs font-medium mt-auto"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <><ChevronUp size={14} /> Ẩn bớt</> : <><ChevronDown size={14} /> Xem thêm</>}
          </button>
          {expanded && (
            <div className="space-y-1.5 border-t border-gray-100 pt-2">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <MapPin size={12} className="text-red-400 flex-shrink-0" />
                <span className="truncate">{place.address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Clock size={12} className="text-red-400" />
                <span>{place.hours}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Phone size={12} className="text-red-400" />
                <span>{place.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center items-center gap-5 py-3 px-4 border-t border-gray-100">
          <button
            onClick={(e) => { e.stopPropagation(); handleNope(); }}
            className="w-14 h-14 rounded-full bg-white border-2 border-red-200 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <X size={26} className="text-red-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            className="w-11 h-11 rounded-full bg-white border-2 border-yellow-200 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Bookmark size={20} className="text-yellow-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-200 active:scale-95 transition-transform"
          >
            <Heart size={26} className="text-white fill-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
