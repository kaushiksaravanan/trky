import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { Users } from 'lucide-react';

export default function DiscoverPage() {
  const { users, currentUser } = useAuthStore();
  const { getUserStats } = useTrackingStore();
  const navigate = useNavigate();

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">
          <Users size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Discover People
        </div>
        <div className="page-subtitle">
          Find fellow trackers -- {otherUsers.length} user{otherUsers.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="page-body" style={{ maxWidth: 640 }}>
        {otherUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No other users yet</div>
            <div className="empty-state-text">
              Create a second account or invite friends to see them here!
            </div>
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.06}>
            {otherUsers.map(user => {
              const stats = getUserStats(user.id);
              const isFollowing = currentUser?.following?.includes(user.id);
              return (
                <StaggerItem key={user.id}>
                  <motion.div
                    className="card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 16, marginBottom: 10, cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/profile/${user.username}`)}
                    whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                  >
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{user.displayName}</div>
                        {isFollowing && (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--accent-soft)', color: 'var(--text-accent)', fontWeight: 600 }}>
                            Following
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{user.username}</div>
                      {user.bio && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.bio}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.totalTracked}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tracked</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.completed}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Done</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--yellow-400)' }}>
                          {stats.avgRating > 0 ? stats.avgRating : '-'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avg</div>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
