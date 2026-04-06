import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS } from '../data/sampleData';
import MediaCard from '../components/tracking/MediaCard';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { Search, SlidersHorizontal, LayoutGrid, LayoutList, X, ArrowUpDown, Filter, Star, Sparkles } from 'lucide-react';

const MOODS = {
  'Chill': { emoji: '😌', genres: ['Slice of Life', 'Comedy', 'Family', 'Folk', 'Indie', 'Cooking'] },
  'Intense': { emoji: '⚡', genres: ['Action', 'Thriller', 'Souls-like', 'War', 'Superhero', 'Horror'] },
  'Brainy': { emoji: '🧠', genres: ['Drama', 'Historical', 'Sci-Fi', 'Mystery', 'Story Rich', 'Thriller'] },
  'Escapism': { emoji: '✨', genres: ['Fantasy', 'Adventure', 'Open World', 'Metroidvania', 'Supernatural'] },
  'Emotional': { emoji: '😭', genres: ['Drama', 'Romance', 'New Adult', 'Young Adult'] },
};

export default function BrowsePage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { media, getMediaByCategory } = useTrackingStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(category || 'all');
  const [sortBy, setSortBy] = useState(() => {
    try { return localStorage.getItem('trky_browse_sortBy') || 'rating'; } catch { return 'rating'; }
  });
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('trky_browse_viewMode') || 'grid'; } catch { return 'grid'; }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [yearRange, setYearRange] = useState('all');
  const [activeMood, setActiveMood] = useState(null);

  // Sync URL category param with internal state on navigation
  useEffect(() => {
    setActiveCategory(category || 'all');
    setSelectedGenres([]);
  }, [category]);

  useEffect(() => { try { localStorage.setItem('trky_browse_viewMode', viewMode); } catch {} }, [viewMode]);
  useEffect(() => { try { localStorage.setItem('trky_browse_sortBy', sortBy); } catch {} }, [sortBy]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setSelectedGenres([]);
    if (cat === 'all') navigate('/browse');
    else navigate(`/browse/${cat}`);
  };

  // Get all unique genres from current category
  const availableGenres = useMemo(() => {
    const items = activeCategory === 'all' ? media : media.filter(m => m.category === activeCategory);
    const genres = new Set();
    items.forEach(m => m.genres?.forEach(g => genres.add(g)));
    return Array.from(genres).sort();
  }, [activeCategory, media]);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  let filtered = activeCategory === 'all' ? media : getMediaByCategory(activeCategory);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.genres?.some(g => g.toLowerCase().includes(q))
    );
  }

  if (selectedGenres.length > 0) {
    filtered = filtered.filter(m =>
      selectedGenres.some(g => m.genres?.includes(g))
    );
  }

  if (yearRange !== 'all') {
    const currentYear = new Date().getFullYear();
    if (yearRange === 'this-year') {
      filtered = filtered.filter(m => m.year === currentYear);
    } else if (yearRange === 'last-year') {
      filtered = filtered.filter(m => m.year === currentYear - 1);
    } else if (yearRange === 'last-5') {
      filtered = filtered.filter(m => m.year >= currentYear - 5);
    } else if (yearRange === 'classic') {
      filtered = filtered.filter(m => m.year < currentYear - 5);
    }
  }

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'rating') cmp = (a.rating || 0) - (b.rating || 0);
    else if (sortBy === 'year') cmp = (a.year || 0) - (b.year || 0);
    else if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const activeFilterCount = selectedGenres.length + (yearRange !== 'all' ? 1 : 0);

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">
          {category ? CATEGORY_LABELS[category] || 'Browse' : 'Browse'}
        </div>
        <div className="page-subtitle">
          Discover and track {category ? CATEGORY_LABELS[category]?.toLowerCase() : 'everything'} -- {filtered.length} titles
        </div>

        <div className="page-toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={16} />
            <input
              type="text"
              className="input"
              placeholder="Search titles, genres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select className="input" style={{ width: 'auto', minWidth: 140 }} value={sortBy} onChange={(e) => { setSortBy(e.target.value); if (e.target.value === 'title') setSortOrder('asc'); }}>
              <option value="rating">Sort by Rating</option>
              <option value="year">Sort by Year</option>
              <option value="title">Sort by Title</option>
            </select>

            <motion.button
              className="btn btn-icon btn-secondary"
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
              style={{ height: 42, width: 42 }}
            >
              <ArrowUpDown size={16} style={{ transform: sortOrder === 'asc' ? 'scaleY(-1)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>

            <motion.button
              className={`btn btn-icon ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ height: 42, position: 'relative' }}
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--accent)', color: 'white',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`btn btn-icon ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`btn btn-icon ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Mood Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Sparkles size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Mood:</span>
          {Object.entries(MOODS).map(([name, { emoji }]) => (
            <motion.button
              key={name}
              className={`chip ${activeMood === name ? 'active' : ''}`}
              onClick={() => {
                if (activeMood === name) { setActiveMood(null); setSelectedGenres([]); }
                else { setActiveMood(name); setSelectedGenres(MOODS[name].genres); }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 12 }}
            >
              {emoji} {name}
            </motion.button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={`tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            All ({media.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {CATEGORY_LABELS[cat]} ({media.filter(m => m.category === cat).length})
            </button>
          ))}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="card"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Filters</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setSelectedGenres([]); setYearRange('all'); }}
                  >
                    <X size={14} /> Clear All
                  </button>
                )}
              </div>

              {/* Genre chips */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Genres
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableGenres.map(genre => (
                    <motion.button
                      key={genre}
                      className={`chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
                      onClick={() => toggleGenre(genre)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {genre}
                      {selectedGenres.includes(genre) && <X size={12} />}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Year filter */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Year
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'this-year', label: `${new Date().getFullYear()}` },
                    { value: 'last-year', label: `${new Date().getFullYear() - 1}` },
                    { value: 'last-5', label: 'Last 5 Years' },
                    { value: 'classic', label: 'Classics' },
                  ].map(opt => (
                    <motion.button
                      key={opt.value}
                      className={`chip ${yearRange === opt.value ? 'active' : ''}`}
                      onClick={() => setYearRange(opt.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filters display */}
        {activeFilterCount > 0 && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Active filters:</span>
            {selectedGenres.map(g => (
              <span key={g} className="chip active" onClick={() => toggleGenre(g)} style={{ fontSize: 11 }}>
                {g} <X size={10} />
              </span>
            ))}
            {yearRange !== 'all' && (
              <span className="chip active" onClick={() => setYearRange('all')} style={{ fontSize: 11 }}>
                {yearRange === 'this-year' ? new Date().getFullYear() : yearRange === 'last-year' ? new Date().getFullYear() - 1 : yearRange === 'last-5' ? 'Last 5 Years' : 'Classics'} <X size={10} />
              </span>
            )}
          </motion.div>
        )}

        {/* Results */}
        {filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <StaggerContainer className="card-grid" staggerDelay={0.04}>
              {filtered.map(item => (
                <StaggerItem key={item.id}>
                  <MediaCard media={item} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <table className="tracking-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Year</th>
                    <th>Genres</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/media/${item.id}`)}>
                      <td>
                        <div className="tracking-table-title">
                          <img className="tracking-table-thumb" src={item.cover} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="genre-tag">{CATEGORY_LABELS[item.category]}</span></td>
                      <td>
                        {item.rating > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={14} fill="var(--yellow-400)" color="var(--yellow-400)" />
                            {item.rating}
                          </div>
                        ) : '-'}
                      </td>
                      <td>{item.year || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {item.genres?.slice(0, 2).map(g => (
                            <span key={g} className="genre-tag">{g}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="empty-state-icon"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatDelay: 2 }}
            >
              🔍
            </motion.div>
            <div className="empty-state-title">No results found</div>
            <div className="empty-state-text">
              {search
                ? `Nothing matches "${search}" -- try a different term`
                : 'No titles match your current filters'}
            </div>
            {(activeFilterCount > 0 || search || activeMood) && (
              <motion.button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => { setSelectedGenres([]); setYearRange('all'); setSearch(''); setActiveMood(null); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Clear Everything
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
