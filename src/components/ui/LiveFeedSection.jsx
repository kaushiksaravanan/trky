import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ExternalLink, Wifi, WifiOff } from 'lucide-react';

// Generic card for external API results
function LiveMediaCard({ item }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.siteUrl) {
      window.open(item.siteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      style={{ width: 160, flexShrink: 0, cursor: 'pointer' }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      onClick={handleClick}
    >
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        aspectRatio: '3/4', background: 'var(--bg-secondary)', marginBottom: 8,
      }}>
        {item.cover ? (
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--text-muted)' }}>
            {item.category === 'books' ? '📚' : '🎬'}
          </div>
        )}
        {item.isNew && (
          <div style={{
            position: 'absolute', top: 6, right: 6, background: 'var(--accent)',
            color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px',
            borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
          }}>
            Airing
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 6, left: 6,
          background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 10, fontWeight: 600,
          padding: '2px 6px', borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <ExternalLink size={9} /> {item.source === 'anilist' ? 'AniList' : item.source === 'mal' ? 'MAL' : 'OpenLibrary'}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.subtitle}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
        <Star size={11} fill="currentColor" style={{ color: 'var(--yellow-400)' }} />
        {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
        {item.year > 0 && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{item.year}</span>}
      </div>
    </motion.div>
  );
}

// Section that loads from an async function
export default function LiveFeedSection({ title, icon, fetchFn, emptyText = 'No data available' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(data => { if (!cancelled) { setItems(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon} {title}
            <WifiOff size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0' }}>
          Could not load live data. Check your connection.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon} {title}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: 14, height: 14, border: '2px solid var(--border-light)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}
            />
          </div>
        </div>
        <div className="horizontal-scroll">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 160, flexShrink: 0 }}>
              <div style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', marginBottom: 8 }} />
              <div style={{ height: 14, borderRadius: 4, background: 'var(--bg-secondary)', width: '80%', marginBottom: 4 }} />
              <div style={{ height: 12, borderRadius: 4, background: 'var(--bg-secondary)', width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div className="section-header">
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon} {title}
          <Wifi size={12} style={{ color: 'var(--green-400)' }} />
          <span style={{ fontSize: 10, color: 'var(--green-400)', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>
      <div className="horizontal-scroll">
        {items.map(item => (
          <LiveMediaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
