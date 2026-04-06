import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS } from '../data/sampleData';
import MediaCard from '../components/tracking/MediaCard';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { Search as SearchIcon, Clock, X, TrendingUp, ArrowRight, Wifi, Star } from 'lucide-react';
import { searchAll } from '../services/api';

const MAX_RECENT = 8;

const loadRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_recent_searches') || '[]');
  } catch { return []; }
};

const saveRecentSearches = (searches) => {
  localStorage.setItem('trky_recent_searches', JSON.stringify(searches.slice(0, MAX_RECENT)));
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [externalResults, setExternalResults] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const { searchMedia, media } = useTrackingStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const results = query.length >= 2 ? searchMedia(query) : [];
  const filtered = activeCategory === 'all' ? results : results.filter(m => m.category === activeCategory);

  // Quick suggestions based on current query
  const suggestions = query.length >= 1 && query.length < 2
    ? media.filter(m => m.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
    : query.length >= 2
    ? results.slice(0, 5)
    : [];

  const addToRecent = useCallback((term) => {
    const cleaned = term.trim();
    if (!cleaned || cleaned.length < 2) return;
    const updated = [cleaned, ...recentSearches.filter(s => s.toLowerCase() !== cleaned.toLowerCase())].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  }, [recentSearches]);

  const clearRecent = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const removeRecent = (term) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(`/media/${suggestions[selectedIndex].id}`);
        addToRecent(suggestions[selectedIndex].title);
        setShowSuggestions(false);
      } else if (query.length >= 2) {
        addToRecent(query);
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
    setShowSuggestions(query.length >= 1);
  }, [query]);

  // Search external APIs with debounce
  useEffect(() => {
    if (query.length < 3) { setExternalResults([]); return; }
    setExternalLoading(true);
    const timer = setTimeout(() => {
      searchAll(query, 8)
        .then(r => { setExternalResults(r); setExternalLoading(false); })
        .catch(() => { setExternalLoading(false); });
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const trending = media
    .filter(m => m.rating >= 8.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">Search</div>
        <div className="page-subtitle">Find anything across all categories</div>

        <div className="page-toolbar" style={{ position: 'relative' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 500, position: 'relative' }}>
            <SearchIcon size={16} />
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Search anime, games, music, books, movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              style={{ paddingLeft: 40, fontSize: 16 }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', padding: 4,
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && query.length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: 4, background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
                  }}
                >
                  {suggestions.map((item, i) => (
                    <motion.div
                      key={item.id}
                      onMouseDown={() => { navigate(`/media/${item.id}`); addToRecent(item.title); }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', cursor: 'pointer',
                        background: selectedIndex === i ? 'var(--bg-hover)' : 'transparent',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                      }}
                    >
                      <img
                        src={item.cover}
                        alt=""
                        style={{ width: 28, height: 36, borderRadius: 4, objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {CATEGORY_LABELS[item.category]} {item.year ? `- ${item.year}` : ''}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)', opacity: selectedIndex === i ? 1 : 0 }} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="page-body">
        <AnimatePresence mode="wait">
          {query.length >= 2 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>"
                </span>
              </div>

              <div className="tabs" style={{ marginBottom: 24 }}>
                <button className={`tab ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
                  All ({results.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = results.filter(m => m.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat} className={`tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                      {CATEGORY_LABELS[cat]} ({count})
                    </button>
                  );
                })}
              </div>

              {filtered.length > 0 ? (
                <StaggerContainer className="card-grid" staggerDelay={0.04}>
                  {filtered.map(item => (
                    <StaggerItem key={item.id}>
                      <MediaCard media={item} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No local results for "{query}"</div>
                  <div className="empty-state-text">Searching online databases...</div>
                </motion.div>
              )}

              {/* External API Results */}
              {query.length >= 3 && (externalLoading || externalResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 24 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Wifi size={14} style={{ color: 'var(--green-400)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>From AniList & Open Library</span>
                    <span style={{ fontSize: 10, color: 'var(--green-400)', fontWeight: 600 }}>LIVE</span>
                    {externalLoading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ width: 12, height: 12, border: '2px solid var(--border-light)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}
                      />
                    )}
                  </div>
                  {externalResults.length > 0 && (
                    <div className="horizontal-scroll">
                      {externalResults.map(item => (
                        <motion.div
                          key={item.id}
                          style={{ width: 160, flexShrink: 0, cursor: 'pointer' }}
                          whileHover={{ y: -4 }}
                          onClick={() => item.siteUrl && window.open(item.siteUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '3/4', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                            {item.cover && <img src={item.cover} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
                            <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                              {item.source === 'anilist' ? 'AniList' : 'OpenLibrary'}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Star size={11} fill="currentColor" style={{ color: 'var(--yellow-400)' }} /> {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {query.length < 2 && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      Recent Searches
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={clearRecent}
                      style={{ fontSize: 11 }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {recentSearches.map(term => (
                      <motion.div
                        key={term}
                        style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <motion.button
                          className="chip"
                          onClick={() => { setQuery(term); addToRecent(term); }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ paddingRight: 6 }}
                        >
                          <Clock size={12} style={{ opacity: 0.5 }} />
                          {term}
                        </motion.button>
                        <button
                          onClick={() => removeRecent(term)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', display: 'flex', padding: 2,
                          }}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Trending</span>
                </div>
                <StaggerContainer className="card-grid" staggerDelay={0.04}>
                  {trending.map(item => (
                    <StaggerItem key={item.id}>
                      <MediaCard media={item} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>

              {/* Quick search terms */}
              <div className="empty-state" style={{ padding: 24 }}>
                <motion.div
                  className="empty-state-icon"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  🔍
                </motion.div>
                <div className="empty-state-title">Start typing to search</div>
                <div className="empty-state-text">
                  Search across {media.length} titles. Use arrow keys to navigate suggestions.
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Attack on Titan', 'Elden Ring', 'One Piece', 'Frieren', 'Baldur\'s Gate'].map(term => (
                    <motion.button
                      key={term}
                      className="chip"
                      onClick={() => { setQuery(term); addToRecent(term); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {term}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
