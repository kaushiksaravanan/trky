import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS } from '../data/sampleData';
import MediaCard from '../components/tracking/MediaCard';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { Sparkles, TrendingUp, Clock, ArrowRight, Compass, List, MessageCircle, Zap, Play, Star, BarChart3, FolderOpen, Tv, BookOpen, Flame } from 'lucide-react';
import LiveFeedSection from '../components/ui/LiveFeedSection';
import { fetchTrendingAnime, fetchSeasonalAnime, fetchTrendingBooks } from '../services/api';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: 'Burning the midnight oil', emoji: '🌙' };
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '👋' };
  if (h < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Night owl mode', emoji: '🦉' };
}

export default function HomePage() {
  const { currentUser } = useAuthStore();
  const { getNewReleases, getRecentlyTracked, getUserStats, media, getRecommendations, userTracking } = useTrackingStore();
  const navigate = useNavigate();

  const newReleases = getNewReleases();
  const recentlyTracked = getRecentlyTracked(currentUser?.id);
  const stats = getUserStats(currentUser?.id);
  const recommendations = getRecommendations(currentUser?.id, 8);
  const greeting = getGreeting();

  // Continue watching - items user is currently watching with progress
  const continueWatching = currentUser ? (() => {
    const tracked = userTracking[currentUser.id] || {};
    return Object.entries(tracked)
      .filter(([, data]) => data.status === 'in-progress')
      .map(([mediaId, data]) => {
        const m = media.find(item => item.id === mediaId);
        if (!m) return null;
        return { ...m, progress: data.progress || 0, totalEps: m.episodes || 0 };
      })
      .filter(Boolean)
      .filter(item => item.totalEps === 0 || item.progress < item.totalEps)
      .sort((a, b) => (b.progress / (b.totalEps || 1)) - (a.progress / (a.totalEps || 1)));
  })() : [];

  // Top rated items across all media
  const topRated = [...media].sort((a, b) => b.rating - a.rating).slice(0, 10);

  // Upcoming releases
  const upcoming = media.filter(m => m.releaseDate && new Date(m.releaseDate) > Date.now())
    .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

  const trendingByCategory = CATEGORIES.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: media.filter(m => m.category === cat).slice(0, 6),
  })).filter(c => c.items.length > 0);

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">Home</div>
        <div className="page-subtitle">Your personalized tracking dashboard</div>
      </div>

      <div className="page-body">
        {/* Welcome section */}
        <motion.div
          className="welcome-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{greeting.emoji}</span>
            <span className="welcome-title">{greeting.text}, {currentUser?.displayName}!</span>
          </div>
          <div className="welcome-text">
            {stats.totalTracked > 0
              ? `You're tracking ${stats.totalTracked} items with ${stats.completed} completed. Keep going!`
              : 'Start tracking your favorite anime, games, music, books, and more!'}
          </div>
          <div className="welcome-actions">
            <button className="btn btn-primary" onClick={() => navigate('/browse')}>
              <Compass size={16} /> Browse All
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/my-list')}>
              <List size={16} /> My List
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
              <MessageCircle size={16} /> Chatrooms
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/stats')}>
              <BarChart3 size={16} /> Stats
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/collections')}>
              <FolderOpen size={16} /> Collections
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <StaggerContainer className="stats-grid" style={{ marginBottom: 32 }} staggerDelay={0.08}>
          <StaggerItem>
            <div className="stat-card">
              <div className="stat-card-number">{stats.totalTracked}</div>
              <div className="stat-card-label">Tracking</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="stat-card">
              <div className="stat-card-number">{stats.completed}</div>
              <div className="stat-card-label">Completed</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="stat-card">
              <div className="stat-card-number">{stats.inProgress}</div>
              <div className="stat-card-label">In Progress</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="stat-card">
              <div className="stat-card-number" style={{ color: 'var(--yellow-400)' }}>
                {stats.avgRating > 0 ? `${stats.avgRating}` : '-'}
              </div>
              <div className="stat-card-label">Avg Rating</div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title">
                <Play size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent)' }} />
                Continue Watching
              </div>
              <span className="section-link" onClick={() => navigate('/my-list')}>View all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
            </div>
            <div className="horizontal-scroll">
              {continueWatching.slice(0, 8).map(item => (
                <div key={item.id} style={{ width: 200 }}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/media/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <MediaCard media={item} showStatus />
                    {item.totalEps > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                          <span>Ep {item.progress}/{item.totalEps}</span>
                          <span>{Math.round((item.progress / item.totalEps) * 100)}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            background: 'var(--accent)',
                            width: `${Math.min(100, (item.progress / item.totalEps) * 100)}%`,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently tracked */}
        {recentlyTracked.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title"><Clock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Recently Updated</div>
              <span className="section-link" onClick={() => navigate('/my-list')}>View all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
            </div>
            <div className="horizontal-scroll">
              {recentlyTracked.map(item => (
                <div key={item.id} style={{ width: 200 }}>
                  <MediaCard media={item} showStatus />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title"><Clock size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#8b5cf6' }} />Coming Soon</div>
            </div>
            <div className="horizontal-scroll">
              {upcoming.map(item => (
                <div key={item.id} style={{ width: 200 }}>
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Releases */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <div className="section-title"><TrendingUp size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />New Releases</div>
            <span className="section-link" onClick={() => navigate('/browse')}>Browse all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
          </div>
          <div className="horizontal-scroll">
            {newReleases.slice(0, 10).map(item => (
              <div key={item.id} style={{ width: 200 }}>
                <MediaCard media={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Rated */}
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <div className="section-title">
              <Star size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--yellow-400)' }} />
              Top Rated
            </div>
            <span className="section-link" onClick={() => navigate('/browse')}>See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
          </div>
          <div className="horizontal-scroll">
            {topRated.map((item, idx) => (
              <div key={item.id} style={{ width: 200, position: 'relative' }}>
                <MediaCard media={item} />
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  width: 26, height: 26, borderRadius: '50%',
                  background: idx < 3 ? 'var(--accent)' : 'var(--bg-card)',
                  border: idx < 3 ? 'none' : '1px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: idx < 3 ? 'white' : 'var(--text-secondary)',
                  boxShadow: 'var(--shadow-md)',
                }}>
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title">
                <Zap size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent)' }} />
                Recommended for You
              </div>
              <span className="section-link" onClick={() => navigate('/browse')}>See more <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
            </div>
            <div className="horizontal-scroll">
              {recommendations.map(item => (
                <div key={item.id} style={{ width: 200 }}>
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Feeds from External APIs */}
        <LiveFeedSection
          title="Trending Anime"
          icon={<Tv size={18} style={{ color: '#ec4899' }} />}
          fetchFn={fetchTrendingAnime}
        />
        <LiveFeedSection
          title="This Season's Anime"
          icon={<Flame size={18} style={{ color: '#f97316' }} />}
          fetchFn={fetchSeasonalAnime}
        />
        <LiveFeedSection
          title="Trending Books"
          icon={<BookOpen size={18} style={{ color: '#8b5cf6' }} />}
          fetchFn={fetchTrendingBooks}
        />

        {/* Trending by category */}
        {trendingByCategory.map(({ category, label, items }) => (
          <div key={category} style={{ marginBottom: 32 }}>
            <div className="section-header">
              <div className="section-title">{label}</div>
              <span className="section-link" onClick={() => navigate(`/browse/${category}`)}>
                See all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </span>
            </div>
            <div className="horizontal-scroll">
              {items.map(item => (
                <div key={item.id} style={{ width: 200 }}>
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
