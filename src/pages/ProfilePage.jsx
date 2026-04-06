import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORY_LABELS } from '../data/sampleData';
import MediaCard from '../components/tracking/MediaCard';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import { UserPlus, UserCheck, Calendar, Star, BarChart3, Copy, Clock, PlayCircle, CheckCircle, Sparkles, Heart } from 'lucide-react';
import { formatDate, timeAgo } from '../utils/helpers';

const ACTIVITY_ICONS = {
  started: { icon: PlayCircle, color: 'var(--blue-400)', label: 'Started tracking' },
  completed: { icon: CheckCircle, color: 'var(--green-400)', label: 'Completed' },
  rated: { icon: Star, color: 'var(--yellow-400)', label: 'Rated' },
};

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser, getUserByUsername, followUser, getFavorites, reorderFavorites } = useAuthStore();
  const { getUserTrackedMedia, getUserStats, getUserActivity, getRecommendations, getMediaById } = useTrackingStore();

  const [activeTab, setActiveTab] = useState('all');
  const [showActivity, setShowActivity] = useState(true);

  const profileUser = getUserByUsername(username);

  if (!profileUser) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-title">User not found</div>
          <div className="empty-state-text">This user doesn't exist or the profile URL is incorrect.</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isFollowing = currentUser?.following?.includes(profileUser.id);
  const trackedMedia = getUserTrackedMedia(profileUser.id);
  const stats = getUserStats(profileUser.id);
  const activities = getUserActivity(profileUser.id);
  const recommendations = isOwnProfile ? getRecommendations(profileUser.id, 6) : [];

  // Compatibility score for other users' profiles
  const compatibility = useMemo(() => {
    if (isOwnProfile || !currentUser) return null;
    const myTracking = getUserTrackedMedia(currentUser.id);
    const myIds = new Set(myTracking.map(m => m.id));
    const shared = trackedMedia.filter(m => myIds.has(m.id));
    if (shared.length === 0) return { score: 0, shared: 0 };
    let ratingScore = 0, ratedCount = 0;
    shared.forEach(m => {
      const myItem = myTracking.find(t => t.id === m.id);
      if (myItem?.tracking?.rating > 0 && m.tracking?.rating > 0) {
        ratingScore += 10 - Math.abs(myItem.tracking.rating - m.tracking.rating);
        ratedCount++;
      }
    });
    const avgAgreement = ratedCount > 0 ? Math.round((ratingScore / ratedCount / 10) * 100) : 50;
    const overlapBonus = Math.min(shared.length * 5, 30);
    const score = Math.min(avgAgreement + overlapBonus, 100);
    return { score, shared: shared.length };
  }, [isOwnProfile, currentUser?.id, trackedMedia]);

  const filteredMedia = activeTab === 'all'
    ? trackedMedia
    : trackedMedia.filter(m => m.tracking?.status === activeTab);

  // Category breakdown
  const categoryBreakdown = {};
  trackedMedia.forEach(m => {
    const cat = m.category || 'other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${profileUser.username}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Profile link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleFollow = () => {
    followUser(profileUser.id);
    if (!isFollowing) toast.success(`Now following ${profileUser.displayName}`);
  };

  return (
    <PageTransition>
      {/* Banner */}
      <motion.div
        className="profile-banner"
        style={{ background: profileUser.bannerColor ? `linear-gradient(135deg, ${profileUser.bannerColor}, var(--violet-400))` : undefined }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Profile info */}
      <div className="profile-info">
        <motion.div
          className="profile-avatar"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <img src={profileUser.avatar} alt={profileUser.username} />
        </motion.div>
        <div className="profile-details">
          <div className="profile-name">{profileUser.displayName}</div>
          <div className="profile-username">@{profileUser.username}</div>
          {profileUser.bio && <div className="profile-bio">{profileUser.bio}</div>}

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-number">{stats.totalTracked}</div>
              <div className="profile-stat-label">Tracked</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number">{stats.completed}</div>
              <div className="profile-stat-label">Completed</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number" style={{ color: 'var(--yellow-400)' }}>
                {stats.avgRating > 0 ? stats.avgRating : '-'}
              </div>
              <div className="profile-stat-label">Avg Rating</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number">{profileUser.followers?.length || 0}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-number">{profileUser.following?.length || 0}</div>
              <div className="profile-stat-label">Following</div>
            </div>
          </div>

          <div className="profile-actions">
            {!isOwnProfile && (
              <motion.button
                className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleFollow}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
              </motion.button>
            )}
            <motion.button
              className="btn btn-secondary"
              onClick={handleShare}
              whileTap={{ scale: 0.97 }}
            >
              <Copy size={16} /> Share Profile
            </motion.button>
            {isOwnProfile && (
              <button className="btn btn-ghost" onClick={() => navigate('/settings')}>
                Edit Profile
              </button>
            )}
          </div>

          {/* Compatibility Score */}
          {compatibility && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '10px 16px',
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `conic-gradient(${compatibility.score >= 70 ? 'var(--green-400)' : compatibility.score >= 40 ? 'var(--yellow-400)' : 'var(--text-muted)'} ${compatibility.score * 3.6}deg, var(--bg-hover) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: 'var(--text-primary)',
                }}>
                  {compatibility.score}%
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Taste Compatibility</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{compatibility.shared} titles in common</div>
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <Calendar size={12} /> Joined {formatDate(profileUser.joinedAt)}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Category breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <motion.div
            className="card"
            style={{ marginBottom: 24 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Category Breakdown</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(categoryBreakdown).map(([cat, count]) => (
                <motion.div
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/browse/${cat}`)}
                >
                  <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[cat] || cat}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Favorites Showcase */}
        {(() => {
          const favIds = getFavorites(profileUser.id);
          if (favIds.length === 0) return null;
          const favMedia = favIds.map(id => getMediaById(id)).filter(Boolean);
          if (favMedia.length === 0) return null;
          return (
            <motion.div
              className="card"
              style={{ marginBottom: 24 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Heart size={18} style={{ color: 'var(--accent)' }} fill="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Favorites</span>
              </div>
              <div className="horizontal-scroll">
                {favMedia.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    style={{ position: 'relative', minWidth: 140, cursor: isOwnProfile ? 'grab' : 'default' }}
                    draggable={isOwnProfile}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== i) reorderFavorites(from, i); }}
                  >
                    <div style={{
                      position: 'absolute', top: -8, left: -8, width: 28, height: 28,
                      borderRadius: '50%', background: 'var(--accent)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, zIndex: 2, border: '2px solid var(--bg-card)',
                    }}>
                      {i + 1}
                    </div>
                    <MediaCard media={item} compact />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Activity Feed */}
        {activities.length > 0 && (
          <motion.div
            className="card"
            style={{ marginBottom: 24 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowActivity(!showActivity)}
              >
                {showActivity ? 'Hide' : 'Show'}
              </button>
            </div>

            <AnimatePresence>
              {showActivity && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="activity-feed">
                    {activities.slice(0, 10).map((activity, idx) => {
                      const config = ACTIVITY_ICONS[activity.type];
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={activity.id}
                          className="activity-item"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => navigate(`/media/${activity.mediaId}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="activity-icon" style={{ background: `${config.color}15`, color: config.color }}>
                            <Icon size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 600 }}>{config.label}</span>
                              {' '}
                              <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{activity.mediaTitle}</span>
                              {activity.rating > 0 && activity.type === 'rated' && (
                                <span style={{ marginLeft: 6, color: 'var(--yellow-400)', fontWeight: 700 }}>
                                  {activity.rating}/10
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {activity.category && <span className="genre-tag" style={{ marginRight: 6 }}>{CATEGORY_LABELS[activity.category] || activity.category}</span>}
                              {timeAgo(new Date(activity.timestamp).getTime())}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Recommendations (only on own profile) */}
        {isOwnProfile && recommendations.length > 0 && (
          <motion.div
            style={{ marginBottom: 24 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                <span className="section-title">Recommended for You</span>
              </div>
              <span className="section-link" onClick={() => navigate('/browse')}>View All</span>
            </div>
            <div className="horizontal-scroll">
              {recommendations.map(item => (
                <div key={item.id} style={{ width: 180 }}>
                  <MediaCard media={item} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tracked media */}
        <div style={{ marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              All ({trackedMedia.length})
            </button>
            <button className={`tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
              Completed ({trackedMedia.filter(m => m.tracking?.status === 'completed').length})
            </button>
            <button className={`tab ${activeTab === 'in-progress' ? 'active' : ''}`} onClick={() => setActiveTab('in-progress')}>
              In Progress ({trackedMedia.filter(m => m.tracking?.status === 'in-progress').length})
            </button>
            <button className={`tab ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>
              Planning ({trackedMedia.filter(m => m.tracking?.status === 'planning').length})
            </button>
          </div>
        </div>

        {filteredMedia.length > 0 ? (
          <StaggerContainer className="card-grid" staggerDelay={0.04}>
            {filteredMedia.map(item => (
              <StaggerItem key={item.id}>
                <MediaCard media={item} showStatus />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No items to show</div>
            <div className="empty-state-text">
              {isOwnProfile ? 'Start tracking media to fill up your profile!' : 'This user hasn\'t tracked anything yet.'}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
