import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, onRate, size = 20, maxStars = 10 }) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  return (
    <div
      className="rating-stars"
      style={{ gap: 3 }}
      onMouseLeave={() => setHoverRating(0)}
    >
      {Array.from({ length: maxStars }, (_, i) => (
        <motion.button
          key={i}
          className={`rating-star ${i < displayRating ? 'filled' : ''}`}
          onClick={() => onRate && onRate(i + 1 === rating ? 0 : i + 1)}
          onMouseEnter={() => onRate && setHoverRating(i + 1)}
          whileHover={{ scale: 1.3, y: -2 }}
          whileTap={{ scale: 0.8 }}
          style={{ background: 'none', border: 'none', cursor: onRate ? 'pointer' : 'default', padding: 0, transition: 'color 0.15s' }}
          title={`${i + 1}/${maxStars}`}
          aria-label={`Rate ${i + 1} out of ${maxStars}`}
        >
          <Star size={size} fill={i < displayRating ? 'currentColor' : 'none'} />
        </motion.button>
      ))}
      {displayRating > 0 && (
        <motion.span
          key={displayRating}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginLeft: 8, fontSize: size * 0.7, fontWeight: 700,
            color: hoverRating ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {displayRating}/{maxStars}
        </motion.span>
      )}
    </div>
  );
}
