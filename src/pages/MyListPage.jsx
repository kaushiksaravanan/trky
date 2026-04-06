import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS, STATUS_OPTIONS, STATUS_LABELS, STATUS_COLORS } from '../data/sampleData';
import MediaCard from '../components/tracking/MediaCard';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import { Search, LayoutGrid, LayoutList, Star, Trash2, Compass, ArrowUpDown, Clock, BarChart3, TrendingUp, Shuffle } from 'lucide-react';

export default function MyListPage() {
  const { currentUser } = useAuthStore();
  const { getUserTrackedMedia, getUserStats, removeTracking } = useTrackingStore();
  const navigate = useNavigate();

  const [activeStatus, setActiveStatus] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('trky_list_viewMode') || 'grid'; } catch { return 'grid'; }
  });
  const [sortBy, setSortBy] = useState(() => {
    try { return localStorage.getItem('trky_list_sortBy') || 'updated'; } catch { return 'updated'; }
  });
  const [sortOrder, setSortOrder] = useState('desc');
  const [randomPick, setRandomPick] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => { try { localStorage.setItem('trky_list_viewMode', viewMode); } catch {} }, [viewMode]);
  useEffect(() => { try { localStorage.setItem('trky_list_sortBy', sortBy); } catch {} }, [sortBy]);

  const allTracked = getUserTrackedMedia(currentUser?.id);
  const stats = getUserStats(currentUser?.id);

  let filtered = allTracked;
  if (activeStatus !== 'all') {
    filtered = filtered.filter(m => m.tracking?.status === activeStatus);
  }
  if (activeCategory !== 'all') {
    filtered = filtered.filter(m => m.category === activeCategory);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m => m.title?.toLowerCase().includes(q) || m.subtitle?.toLowerCase().includes(q));
  }

  // Sorting
  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'updated') {
      cmp = new Date(a.tracking?.updatedAt || 0) - new Date(b.tracking?.updatedAt || 0);
    } else if (sortBy === 'rating') {
      cmp = (a.tracking?.rating || 0) - (b.tracking?.rating || 0);
    } else if (sortBy === 'title') {
      cmp = (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'progress') {
      const aP = a.episodes ? ((a.tracking?.progress || 0) / a.episodes) : 0;
      const bP = b.episodes ? ((b.tracking?.progress || 0) / b.episodes) : 0;
      cmp = aP - bP;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const handleRemove = (e, userId, mediaId, title) => {
    e.stopPropagation();
    removeTracking(userId, mediaId);
    toast.info(`"${title}" removed from your list`);
  };

  const handleRandomPick = () => {
    const planningItems = allTracked.filter(m => m.tracking?.status === 'planning');
    if (planningItems.length === 0) { toast.info('No items in your "Planning" list to pick from!'); return; }
    setIsSpinning(true);
    setRandomPick(null);
    // Simulate spinning through items
    let count = 0;
    const interval = setInterval(() => {
      setRandomPick(planningItems[Math.floor(Math.random() * planningItems.length)]);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        const final = planningItems[Math.floor(Math.random() * planningItems.length)];
        setRandomPick(final);
        setIsSpinning(false);
      }
    }, 100 + count * 20);
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">My List</div>
        <div className="page-subtitle">{allTracked.length} items tracked</div>

        {/* Random Picker */}
        {allTracked.some(m => m.tracking?.status === 'planning') && (
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              className="btn btn-primary btn-sm"
              onClick={handleRandomPick}
              disabled={isSpinning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <Shuffle size={14} className={isSpinning ? '' : ''} /> {isSpinning ? 'Picking...' : "What should I watch?"}
            </motion.button>
            <AnimatePresence mode="wait">
              {randomPick && (
                <motion.div
                  key={randomPick.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onClick={() => navigate(`/media/${randomPick.id}`)}
                >
                  <img src={randomPick.cover} alt={randomPick.title} style={{ width: 36, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isSpinning ? 'var(--text-muted)' : 'var(--text-primary)' }}>{randomPick.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{randomPick.category} {randomPick.rating ? `-- ${randomPick.rating}` : ''}</div>
                  </div>
                  {!isSpinning && <Star size={14} style={{ color: 'var(--accent)' }} />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="page-toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
            <Search size={16} />
            <input
              type="text"
              className="input"
              placeholder="Search your list..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>

          <select className="input" style={{ width: 'auto', minWidth: 150 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="updated">Sort by Updated</option>
            <option value="rating">Sort by Rating</option>
            <option value="title">Sort by Title</option>
            <option value="progress">Sort by Progress</option>
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
        {/* Quick stats when items exist */}
        {allTracked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 12, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}
          >
            {[
              { label: 'Tracked', value: stats.totalTracked, icon: BarChart3, color: 'var(--accent)' },
              { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'var(--green-400)' },
              { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'var(--blue-400)' },
              { label: 'Avg Rating', value: stats.avgRating > 0 ? stats.avgRating : '-', icon: Star, color: 'var(--yellow-400)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div
                key={label}
                className="card"
                whileHover={{ scale: 1.02 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', flex: '0 0 auto', minWidth: 140 }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Status tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${activeStatus === 'all' ? 'active' : ''}`} onClick={() => setActiveStatus('all')}>
            All ({allTracked.length})
          </button>
          {STATUS_OPTIONS.map(status => {
            const count = allTracked.filter(m => m.tracking?.status === status).length;
            return (
              <button
                key={status}
                className={`tab ${activeStatus === status ? 'active' : ''}`}
                onClick={() => setActiveStatus(status)}
                style={activeStatus === status ? { borderBottom: `2px solid ${STATUS_COLORS[status]}` } : {}}
              >
                {STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <StaggerContainer className="card-grid" staggerDelay={0.04}>
              {filtered.map(item => (
                <StaggerItem key={item.id}>
                  <MediaCard media={item} showStatus />
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
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Progress</th>
                    <th></th>
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
                      <td><span className={`status-badge ${item.tracking?.status}`}>{STATUS_LABELS[item.tracking?.status]}</span></td>
                      <td>
                        {item.tracking?.rating > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={14} fill="var(--yellow-400)" color="var(--yellow-400)" />
                            {item.tracking.rating}/10
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        {item.episodes ? (
                          <div>
                            <div style={{ fontSize: 13 }}>{item.tracking?.progress || 0}/{item.episodes}</div>
                            <div className="progress-bar" style={{ width: 60, marginTop: 4 }}>
                              <div className="progress-bar-fill" style={{ width: `${Math.min(100, ((item.tracking?.progress || 0) / item.episodes) * 100)}%` }} />
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => handleRemove(e, currentUser.id, item.id, item.title)}
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={14} />
                        </button>
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
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              {allTracked.length === 0 ? '📋' : '🔍'}
            </motion.div>
            <div className="empty-state-title">
              {allTracked.length === 0 ? 'Your list is empty' : 'No matches found'}
            </div>
            <div className="empty-state-text">
              {allTracked.length === 0
                ? 'Start tracking anime, games, music, and more from the Browse page!'
                : 'Try adjusting your filters or search terms'}
            </div>
            {allTracked.length === 0 && (
              <motion.button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/browse')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Compass size={16} /> Browse All
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
