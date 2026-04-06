import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS } from '../data/sampleData';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { BarChart3, TrendingUp, Star, Award, Target, Flame, Calendar, BookOpen, Tv, Gamepad2, Music, Film, Monitor, Smile } from 'lucide-react';

const categoryIcons = {
  anime: Tv,
  games: Gamepad2,
  music: Music,
  books: BookOpen,
  cartoons: Smile,
  movies: Film,
  'tv-shows': Monitor,
};

const CATEGORY_COLORS = {
  anime: '#ec4899',
  games: '#8b5cf6',
  music: '#34d399',
  books: '#f59e0b',
  cartoons: '#60a5fa',
  movies: '#f43f5e',
  'tv-shows': '#a78bfa',
};

// Simple bar chart component (no dependencies needed)
function BarChart({ data, maxValue, height = 200 }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '0 4px' }}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / max) * (height - 40), 2);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.value}
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                width: '100%',
                maxWidth: 48,
                borderRadius: '6px 6px 2px 2px',
                background: item.color || 'var(--accent)',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal progress bar
function HorizontalBar({ label, value, max, color, icon: Icon }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={14} style={{ color }} />}
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-hover)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: color || 'var(--accent)' }}
        />
      </div>
    </div>
  );
}

// Donut/ring chart
function DonutChart({ segments, size = 140, strokeWidth = 20 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-hover)" strokeWidth={strokeWidth} />
      {segments.filter(s => s.value > 0).map((segment, i) => {
        const segmentLength = (segment.value / total) * circumference;
        const currentOffset = offset;
        offset += segmentLength;

        return (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" style={{ fontSize: 24, fontWeight: 800, fill: 'var(--text-primary)' }}>
        {total}
      </text>
    </svg>
  );
}

// Rating distribution (1-10 histogram)
function RatingHistogram({ ratings }) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}`,
    value: ratings.filter(r => Math.round(r) === i + 1).length,
    color: i < 3 ? '#f87171' : i < 5 ? '#fbbf24' : i < 7 ? '#60a5fa' : i < 9 ? '#34d399' : '#ec4899',
  }));
  return <BarChart data={buckets} height={160} />;
}

export default function StatsPage() {
  const { currentUser } = useAuthStore();
  const { getUserTracking, getUserStats, getUserTrackedMedia, userTracking: trackingData, getActivityByDay, getStreakData, getMilestones } = useTrackingStore();

  const stats = useMemo(() => getUserStats(currentUser?.id), [currentUser?.id, trackingData]);
  const trackedMedia = useMemo(() => getUserTrackedMedia(currentUser?.id), [currentUser?.id, trackingData]);
  const userTracking = useMemo(() => getUserTracking(currentUser?.id), [currentUser?.id, trackingData]);
  const activityByDay = useMemo(() => getActivityByDay(currentUser?.id), [currentUser?.id, trackingData]);
  const streakData = useMemo(() => getStreakData(currentUser?.id), [currentUser?.id, trackingData]);
  const milestones = useMemo(() => getMilestones(currentUser?.id), [currentUser?.id, trackingData]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts = {};
    trackedMedia.forEach(item => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return CATEGORIES.map(cat => ({
      label: CATEGORY_LABELS[cat]?.slice(0, 6),
      fullLabel: CATEGORY_LABELS[cat],
      value: counts[cat] || 0,
      color: CATEGORY_COLORS[cat],
      icon: categoryIcons[cat],
    }));
  }, [trackedMedia]);

  // Status distribution for donut
  const statusSegments = useMemo(() => [
    { label: 'Completed', value: stats.completed, color: '#34d399' },
    { label: 'In Progress', value: stats.inProgress, color: '#60a5fa' },
    { label: 'Planning', value: stats.planning, color: '#a78bfa' },
    { label: 'On Hold', value: stats.onHold, color: '#fbbf24' },
    { label: 'Dropped', value: stats.dropped, color: '#f87171' },
  ], [stats]);

  // All ratings
  const allRatings = useMemo(() => {
    return Object.values(userTracking).filter(t => t.rating > 0).map(t => t.rating);
  }, [userTracking]);

  // Genre breakdown
  const genreData = useMemo(() => {
    const counts = {};
    trackedMedia.forEach(item => {
      item.genres?.forEach(g => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [trackedMedia]);

  // Completion rate
  const completionRate = stats.totalTracked > 0
    ? Math.round((stats.completed / stats.totalTracked) * 100)
    : 0;

  // Time tracking (months active)
  const trackingTimeline = useMemo(() => {
    const months = {};
    Object.values(userTracking).forEach(t => {
      if (t.startedAt) {
        const month = t.startedAt.substring(0, 7); // YYYY-MM
        months[month] = (months[month] || 0) + 1;
      }
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [userTracking]);

  // Top rated items
  const topRated = useMemo(() => {
    return trackedMedia
      .filter(m => m.tracking?.rating >= 8)
      .sort((a, b) => (b.tracking?.rating || 0) - (a.tracking?.rating || 0))
      .slice(0, 5);
  }, [trackedMedia]);

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">
          <BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
          Statistics
        </div>
        <div className="page-subtitle">
          Your tracking insights and analytics
        </div>
      </div>

      <div className="page-body">
        <StaggerContainer staggerDelay={0.06}>
          {/* Quick stats row */}
          <StaggerItem>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Tracked', value: stats.totalTracked, icon: Target, color: 'var(--accent)' },
                { label: 'Completed', value: stats.completed, icon: Award, color: '#34d399' },
                { label: 'In Progress', value: stats.inProgress, icon: Flame, color: '#60a5fa' },
                { label: 'Avg Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-', icon: Star, color: '#fbbf24' },
                { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: '#a78bfa' },
                { label: 'Ratings Given', value: stats.totalRatings, icon: BarChart3, color: '#f43f5e' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="card"
                  style={{ textAlign: 'center', padding: 16 }}
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                >
                  <stat.icon size={20} style={{ color: stat.color, marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </StaggerItem>

          <div className="stats-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Status donut chart */}
            <StaggerItem>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={16} style={{ color: 'var(--accent)' }} />
                  Status Breakdown
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                  <DonutChart segments={statusSegments} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {statusSegments.filter(s => s.value > 0).map((seg, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{seg.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Category chart */}
            <StaggerItem>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                  By Category
                </h3>
                <BarChart data={categoryData} height={180} />
              </div>
            </StaggerItem>
          </div>

          <div className="stats-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Rating distribution */}
            <StaggerItem>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={16} style={{ color: '#fbbf24' }} />
                  Rating Distribution
                </h3>
                {allRatings.length > 0 ? (
                  <RatingHistogram ratings={allRatings} />
                ) : (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rate some titles to see your distribution</div>
                  </div>
                )}
              </div>
            </StaggerItem>

            {/* Top genres */}
            <StaggerItem>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={16} style={{ color: '#f43f5e' }} />
                  Top Genres
                </h3>
                {genreData.length > 0 ? (
                  <div>
                    {genreData.map(([genre, count], i) => (
                      <HorizontalBar
                        key={genre}
                        label={genre}
                        value={count}
                        max={genreData[0][1]}
                        color={Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track some titles to see your genre preferences</div>
                  </div>
                )}
              </div>
            </StaggerItem>
          </div>

          {/* Top rated */}
          <StaggerItem>
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={16} style={{ color: '#fbbf24' }} />
                Your Top Rated
              </h3>
              {topRated.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topRated.map((item, i) => (
                    <motion.div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                      }}
                      whileHover={{ x: 4, background: 'var(--bg-hover)' }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? '#fbbf24' : i === 1 ? '#a3a3a3' : i === 2 ? '#d97706' : 'var(--text-muted)', width: 24, textAlign: 'center' }}>
                        {i + 1}
                      </span>
                      <img
                        src={item.cover}
                        alt=""
                        style={{ width: 36, height: 48, borderRadius: 6, objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{CATEGORY_LABELS[item.category]}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={14} fill="#fbbf24" color="#fbbf24" />
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{item.tracking?.rating}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rate titles 8+ to see them here</div>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Tracking activity timeline */}
          {trackingTimeline.length > 0 && (
            <StaggerItem>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} style={{ color: 'var(--accent)' }} />
                  Tracking Timeline
                </h3>
                <BarChart
                  data={trackingTimeline.map(([month, count]) => ({
                    label: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
                    value: count,
                    color: 'var(--accent)',
                  }))}
                  height={140}
                />
              </div>
            </StaggerItem>
          )}

          {/* Streaks & Milestones */}
          <StaggerItem>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Flame size={18} style={{ color: '#f97316' }} />
                <h3 style={{ margin: 0, fontSize: 16 }}>Streaks & Milestones</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#f97316' }}>{streakData.current}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Streak</div>
                </div>
                <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{streakData.longest}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Longest Streak</div>
                </div>
                <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green-400)' }}>{streakData.totalDays}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Days</div>
                </div>
              </div>
              {milestones.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Achievements Unlocked</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {milestones.map(m => (
                      <motion.div
                        key={m.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                          background: 'var(--accent-soft)', borderRadius: 'var(--radius-full)',
                          fontSize: 12, fontWeight: 600, color: 'var(--text-accent)',
                        }}
                      >
                        <span>{m.icon}</span> {m.label}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Activity Heatmap */}
          <StaggerItem>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Calendar size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: 16 }}>Activity Heatmap</h3>
              </div>
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
                  {(() => {
                    const today = new Date();
                    const weeks = [];
                    for (let w = 51; w >= 0; w--) {
                      const week = [];
                      for (let d = 0; d < 7; d++) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - (w * 7 + (6 - d)));
                        const key = date.toISOString().split('T')[0];
                        const count = activityByDay[key] || 0;
                        const opacity = count === 0 ? 0.08 : count <= 1 ? 0.3 : count <= 2 ? 0.55 : count <= 4 ? 0.8 : 1;
                        week.push(
                          <motion.div
                            key={key}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: (51 - w) * 0.003 + d * 0.001 }}
                            title={`${key}: ${count} action${count !== 1 ? 's' : ''}`}
                            style={{
                              width: 11, height: 11, borderRadius: 2,
                              background: count === 0 ? 'var(--bg-hover)' : 'var(--accent)',
                              opacity: count === 0 ? 1 : opacity,
                              cursor: 'default',
                            }}
                          />
                        );
                      }
                      weeks.push(<div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{week}</div>);
                    }
                    return weeks;
                  })()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Less</span>
                {[0.08, 0.3, 0.55, 0.8, 1].map((op, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: i === 0 ? 'var(--bg-hover)' : 'var(--accent)', opacity: i === 0 ? 1 : op }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
