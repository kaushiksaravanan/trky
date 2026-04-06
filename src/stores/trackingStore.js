// Tracking store - track media across all categories
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { sampleMedia } from '../data/sampleData';
import { useNotificationStore } from './notificationStore';

const loadTracking = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_tracking') || '{}');
  } catch { return {}; }
};

const saveTracking = (tracking) => {
  localStorage.setItem('trky_tracking', JSON.stringify(tracking));
};

const loadCustomMedia = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_custom_media') || '[]');
  } catch { return []; }
};

const saveCustomMedia = (media) => {
  localStorage.setItem('trky_custom_media', JSON.stringify(media));
};

export const useTrackingStore = create((set, get) => ({
  media: [...sampleMedia, ...loadCustomMedia()],
  userTracking: loadTracking(), // { [userId]: { [mediaId]: { status, rating, progress, notes, startedAt, completedAt } } }

  getMediaByCategory: (category) => {
    return get().media.filter(m => m.category === category);
  },

  getMediaById: (id) => {
    return get().media.find(m => m.id === id);
  },

  searchMedia: (query) => {
    const q = query.toLowerCase();
    return get().media.filter(
      m => m.title?.toLowerCase().includes(q) || m.subtitle?.toLowerCase().includes(q) ||
           m.genres?.some(g => g.toLowerCase().includes(q))
    );
  },

  getUserTracking: (userId) => {
    return get().userTracking[userId] || {};
  },

  getTrackedItem: (userId, mediaId) => {
    return get().userTracking[userId]?.[mediaId] || null;
  },

  trackMedia: (userId, mediaId, data) => {
    const tracking = JSON.parse(JSON.stringify(get().userTracking));
    if (!tracking[userId]) tracking[userId] = {};

    const existing = tracking[userId][mediaId] || {};
    tracking[userId][mediaId] = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
      startedAt: existing.startedAt || new Date().toISOString(),
    };

    if (data.status === 'completed' && !existing.completedAt) {
      tracking[userId][mediaId].completedAt = new Date().toISOString();
      const mediaItem = get().media.find(m => m.id === mediaId);
      if (mediaItem) {
        useNotificationStore.getState().addNotification({
          type: 'update', title: 'Title Completed!',
          text: `You completed "${mediaItem.title}" -- nice work!`,
          category: mediaItem.category,
        });
      }
    }

    saveTracking(tracking);
    set({ userTracking: tracking });
  },

  removeTracking: (userId, mediaId) => {
    const tracking = JSON.parse(JSON.stringify(get().userTracking));
    if (tracking[userId]) {
      delete tracking[userId][mediaId];
      saveTracking(tracking);
      set({ userTracking: tracking });
    }
  },

  incrementProgress: (userId, mediaId) => {
    const tracking = JSON.parse(JSON.stringify(get().userTracking));
    if (!tracking[userId]?.[mediaId]) return { completed: false };
    const item = tracking[userId][mediaId];
    const media = get().media.find(m => m.id === mediaId);
    const totalEps = media?.episodes || 0;
    const current = item.progress || 0;
    const next = current + 1;
    item.progress = next;
    item.updatedAt = new Date().toISOString();
    // Auto-complete when reaching total episodes
    if (totalEps > 0 && next >= totalEps && item.status !== 'completed') {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        type: 'update', title: 'Series Completed!',
        text: `You finished all ${totalEps} episodes of "${media?.title}"`,
        category: media?.category,
      });
      saveTracking(tracking);
      set({ userTracking: tracking });
      return { completed: true, title: media?.title };
    }
    saveTracking(tracking);
    set({ userTracking: tracking });
    return { completed: false };
  },

  getSimilarMedia: (mediaId, limit = 8) => {
    const media = get().media;
    const target = media.find(m => m.id === mediaId);
    if (!target || !target.genres) return [];
    const targetGenres = new Set(target.genres);
    return media
      .filter(m => m.id !== mediaId && m.category === target.category)
      .map(m => {
        const overlap = m.genres?.filter(g => targetGenres.has(g)).length || 0;
        return { ...m, similarity: overlap };
      })
      .filter(m => m.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity || (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  },

  getActivityByDay: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const dayMap = {};
    Object.values(tracking).forEach(data => {
      [data.startedAt, data.completedAt, data.updatedAt].forEach(ts => {
        if (!ts) return;
        const day = ts.split('T')[0];
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
    });
    return dayMap;
  },

  getStreakData: (userId) => {
    const dayMap = get().getActivityByDay(userId);
    const days = Object.keys(dayMap).sort().reverse();
    if (days.length === 0) return { current: 0, longest: 0, totalDays: 0 };
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let current = 0;
    let check = days.includes(today) ? today : (days.includes(yesterday) ? yesterday : null);
    if (check) {
      let d = new Date(check);
      while (dayMap[d.toISOString().split('T')[0]]) {
        current++;
        d = new Date(d.getTime() - 86400000);
      }
    }
    // Longest streak
    let longest = 0, streak = 0;
    const allSorted = Object.keys(dayMap).sort();
    for (let i = 0; i < allSorted.length; i++) {
      if (i === 0 || (new Date(allSorted[i]) - new Date(allSorted[i - 1])) === 86400000) {
        streak++;
      } else {
        streak = 1;
      }
      longest = Math.max(longest, streak);
    }
    return { current, longest, totalDays: days.length };
  },

  getMilestones: (userId) => {
    const stats = get().getUserStats(userId);
    const tracked = get().getUserTrackedMedia(userId);
    const milestones = [];
    const thresholds = [1, 5, 10, 25, 50, 100];
    thresholds.forEach(t => {
      if (stats.totalTracked >= t) milestones.push({ id: `track-${t}`, icon: '🎯', label: `Tracked ${t} items`, achieved: true });
      if (stats.completed >= t) milestones.push({ id: `complete-${t}`, icon: '🏆', label: `Completed ${t} items`, achieved: true });
    });
    const categories = new Set(tracked.map(m => m.category).filter(Boolean));
    if (categories.size >= 3) milestones.push({ id: 'explorer-3', icon: '🧭', label: 'Multi-fandom Explorer (3+ categories)', achieved: true });
    if (categories.size >= 5) milestones.push({ id: 'explorer-5', icon: '🌍', label: 'Ultimate Explorer (5+ categories)', achieved: true });
    const has10 = tracked.some(m => m.tracking?.rating === 10);
    if (has10) milestones.push({ id: 'perfect-10', icon: '💎', label: 'First Perfect 10 Rating', achieved: true });
    const streakData = get().getStreakData(userId);
    if (streakData.current >= 3) milestones.push({ id: 'streak-3', icon: '🔥', label: '3-Day Streak', achieved: true });
    if (streakData.current >= 7) milestones.push({ id: 'streak-7', icon: '⚡', label: '7-Day Streak', achieved: true });
    return milestones;
  },

  getWrappedData: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const media = get().media;
    const year = new Date().getFullYear();
    const items = Object.entries(tracking)
      .map(([mediaId, data]) => ({ media: media.find(m => m.id === mediaId), data }))
      .filter(i => i.media);
    const thisYear = items.filter(i => i.data.startedAt?.startsWith(String(year)) || i.data.completedAt?.startsWith(String(year)));
    const completed = thisYear.filter(i => i.data.status === 'completed');
    const rated = thisYear.filter(i => i.data.rating > 0);
    const monthCounts = {};
    thisYear.forEach(i => {
      const month = (i.data.completedAt || i.data.startedAt || '').substring(0, 7);
      if (month) monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const busiestMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    const topRated = rated.sort((a, b) => b.data.rating - a.data.rating)[0];
    const genreCounts = {};
    thisYear.forEach(i => i.media.genres?.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
    const catCounts = {};
    thisYear.forEach(i => { if (i.media.category) catCounts[i.media.category] = (catCounts[i.media.category] || 0) + 1; });
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    const totalEps = thisYear.reduce((sum, i) => sum + (i.data.progress || 0), 0);
    return {
      year,
      totalTracked: thisYear.length,
      totalCompleted: completed.length,
      totalEpisodes: totalEps,
      totalRated: rated.length,
      avgRating: rated.length > 0 ? (rated.reduce((s, i) => s + i.data.rating, 0) / rated.length).toFixed(1) : 0,
      topRated: topRated ? { title: topRated.media.title, rating: topRated.data.rating, cover: topRated.media.cover } : null,
      topGenre: topGenre ? topGenre[0] : null,
      topCategory: topCategory ? topCategory[0] : null,
      busiestMonth: busiestMonth ? busiestMonth[0] : null,
      genresExplored: Object.keys(genreCounts).length,
      categoriesExplored: Object.keys(catCounts).length,
    };
  },

  rateMedia: (userId, mediaId, rating) => {
    const tracking = JSON.parse(JSON.stringify(get().userTracking));
    if (!tracking[userId]) tracking[userId] = {};
    if (!tracking[userId][mediaId]) {
      tracking[userId][mediaId] = {
        status: 'completed',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    tracking[userId][mediaId].rating = rating;
    tracking[userId][mediaId].updatedAt = new Date().toISOString();
    saveTracking(tracking);
    set({ userTracking: tracking });
  },

  getUserStats: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const items = Object.values(tracking);
    const completed = items.filter(i => i.status === 'completed').length;
    const ratings = items.filter(i => i.rating > 0).map(i => i.rating);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    return {
      totalTracked: items.length,
      completed,
      inProgress: items.filter(i => i.status === 'in-progress').length,
      planning: items.filter(i => i.status === 'planning').length,
      dropped: items.filter(i => i.status === 'dropped').length,
      onHold: items.filter(i => i.status === 'on-hold').length,
      avgRating: parseFloat(avgRating),
      totalRatings: ratings.length,
    };
  },

  getUserTrackedMedia: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const media = get().media;
    return Object.entries(tracking).map(([mediaId, data]) => {
      const found = media.find(m => m.id === mediaId);
      if (!found) return null;
      return { ...found, tracking: data };
    }).filter(Boolean);
  },

  getNewReleases: () => {
    return get().media.filter(m => m.isNew);
  },

  getRecentlyTracked: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const media = get().media;
    return Object.entries(tracking)
      .sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt))
      .slice(0, 10)
      .map(([mediaId, data]) => {
        const found = media.find(m => m.id === mediaId);
        if (!found) return null;
        return { ...found, tracking: data };
      })
      .filter(Boolean);
  },

  addCustomMedia: (mediaData) => {
    const newMedia = {
      id: uuidv4(),
      ...mediaData,
      rating: 0,
      isNew: true,
      isCustom: true,
      cover: `https://picsum.photos/seed/${uuidv4()}/300/400`,
      thumbnail: `https://picsum.photos/seed/${uuidv4()}/600/340`,
    };
    const customMedia = loadCustomMedia();
    customMedia.push(newMedia);
    saveCustomMedia(customMedia);
    set(state => ({ media: [...state.media, newMedia] }));
    return newMedia;
  },

  // Recommendation engine - finds items similar to what user has tracked
  getRecommendations: (userId, limit = 10) => {
    const tracking = get().userTracking[userId] || {};
    const media = get().media;
    const trackedIds = new Set(Object.keys(tracking));

    if (trackedIds.size === 0) {
      // If user hasn't tracked anything, return highest rated items
      return [...media].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
    }

    // Gather user preferences
    const trackedItems = Object.entries(tracking).map(([mediaId, data]) => ({
      ...media.find(m => m.id === mediaId),
      tracking: data,
    })).filter(m => m.id);

    // Score genres by frequency and user ratings
    const genreScores = {};
    const categoryScores = {};
    trackedItems.forEach(item => {
      const weight = item.tracking?.rating ? item.tracking.rating / 10 : 0.5;
      item.genres?.forEach(g => {
        genreScores[g] = (genreScores[g] || 0) + weight;
      });
      if (item.category) {
        categoryScores[item.category] = (categoryScores[item.category] || 0) + weight;
      }
    });

    // Score untracked items
    const untracked = media.filter(m => !trackedIds.has(m.id));
    const scored = untracked.map(item => {
      let score = 0;

      // Genre match score
      item.genres?.forEach(g => {
        if (genreScores[g]) score += genreScores[g] * 2;
      });

      // Category match score
      if (categoryScores[item.category]) {
        score += categoryScores[item.category];
      }

      // Base rating boost
      score += (item.rating || 0) / 10;

      // Recency bonus
      if (item.isNew) score += 0.5;

      return { ...item, recommendScore: score };
    });

    return scored.sort((a, b) => b.recommendScore - a.recommendScore).slice(0, limit);
  },

  // Activity log for profile
  getUserActivity: (userId) => {
    const tracking = get().userTracking[userId] || {};
    const media = get().media;
    const activities = [];

    Object.entries(tracking).forEach(([mediaId, data]) => {
      const item = media.find(m => m.id === mediaId);
      if (!item) return;

      if (data.startedAt) {
        activities.push({
          id: `${mediaId}-start`,
          type: 'started',
          mediaId,
          mediaTitle: item.title,
          mediaCover: item.cover,
          category: item.category,
          status: data.status,
          timestamp: data.startedAt,
        });
      }
      if (data.completedAt) {
        activities.push({
          id: `${mediaId}-complete`,
          type: 'completed',
          mediaId,
          mediaTitle: item.title,
          mediaCover: item.cover,
          category: item.category,
          rating: data.rating,
          timestamp: data.completedAt,
        });
      }
      if (data.rating > 0 && data.updatedAt) {
        activities.push({
          id: `${mediaId}-rate`,
          type: 'rated',
          mediaId,
          mediaTitle: item.title,
          mediaCover: item.cover,
          category: item.category,
          rating: data.rating,
          timestamp: data.updatedAt,
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
}));
