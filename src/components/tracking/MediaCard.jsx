import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { Star, Play, Plus, Check, ChevronUp } from 'lucide-react';
import { STATUS_LABELS } from '../../data/sampleData';
import { toast } from '../ui/Toast';

export default function MediaCard({ media, showStatus = false, compact = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getTrackedItem, trackMedia, incrementProgress, rateMedia } = useTrackingStore();
  const [showQuickRate, setShowQuickRate] = useState(false);

  if (!media) return null;

  const tracked = currentUser ? getTrackedItem(currentUser.id, media.id) : null;

  const handleQuickTrack = (e) => {
    e.stopPropagation();
    if (!tracked && currentUser) {
      trackMedia(currentUser.id, media.id, { status: 'planning' });
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const result = incrementProgress(currentUser.id, media.id);
    if (result.completed) {
      toast.success(`Completed ${result.title}!`);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentUser && tracked) setShowQuickRate(true);
  };

  const handleQuickRate = (e, rating) => {
    e.stopPropagation();
    rateMedia(currentUser.id, media.id, rating);
    setShowQuickRate(false);
    toast.success(`Rated ${media.title} ${rating}/10`);
  };

  return (
    <motion.div
      className="media-card"
      onClick={() => navigate(`/media/${media.id}`)}
      onDoubleClick={handleDoubleClick}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="media-card-cover" onMouseLeave={() => setShowQuickRate(false)}>
        <img
          src={media.cover}
          alt={media.title}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Hover overlay */}
        <div className="media-card-overlay">
          <button className="media-card-play-btn" title="View details">
            <Play size={20} fill="white" />
          </button>
          {!tracked && currentUser && (
            <button
              className="media-card-quick-add"
              onClick={handleQuickTrack}
              title="Quick add to list"
            >
              <Plus size={16} />
            </button>
          )}
          {tracked && (
            <div className="media-card-quick-add tracked">
              <Check size={16} />
            </div>
          )}
          {tracked && tracked.status === 'in-progress' && media.episodes > 0 && (
            <motion.button
              className="media-card-quick-add"
              onClick={handleIncrement}
              title={`Episode ${(tracked.progress || 0) + 1}/${media.episodes}`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              style={{ bottom: 40, background: 'var(--accent)', color: 'white', border: 'none', fontSize: 11, fontWeight: 700, gap: 2 }}
            >
              <ChevronUp size={14} /> +1
            </motion.button>
        )}
        {/* Quick Rate Overlay (double-tap) */}
        {showQuickRate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center',
              padding: 12, zIndex: 10, borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ width: '100%', textAlign: 'center', color: 'white', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Quick Rate</div>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <motion.button
                key={n}
                onClick={(e) => handleQuickRate(e, n)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: tracked?.rating === n ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                  color: 'white', fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {n}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
          {media.isNew && <div className="media-card-badge">NEW</div>}
          {!media.isNew && media.releaseDate && (() => {
            const days = Math.ceil((new Date(media.releaseDate) - Date.now()) / 86400000);
            if (days <= 0) return <div className="media-card-badge" style={{ background: '#22c55e' }}>OUT NOW</div>;
            if (days <= 365) return <div className="media-card-badge" style={{ background: '#8b5cf6' }}>{days}d left</div>;
            return null;
          })()}
        {media.platform && <div className="media-card-platform">{media.platform}</div>}
        {showStatus && tracked && (
          <div className="media-card-status">
            <span className={`status-badge ${tracked.status}`}>{STATUS_LABELS[tracked.status]}</span>
          </div>
        )}
      </div>
      <div className="media-card-body">
        <div className="media-card-title" title={media.title}>{media.title}</div>
        <div className="media-card-subtitle">{media.subtitle}</div>
        <div className="media-card-meta">
          <div className="media-card-rating">
            <Star size={13} fill="currentColor" />
            {media.rating > 0 ? media.rating.toFixed(1) : 'N/A'}
            {tracked?.rating > 0 && (
              <span style={{ color: 'var(--text-accent)', fontSize: 11, marginLeft: 4 }}>
                (You: {tracked.rating})
              </span>
            )}
          </div>
          <div className="media-card-year">{media.year}</div>
        </div>
        {!compact && media.genres && (
          <div className="media-card-genres">
            {media.genres.slice(0, 3).map(g => (
              <span key={g} className="genre-tag">{g}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
