// Reviews store - user reviews/comments on media items
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'trky_reviews';

const loadReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
};

const saveReviews = (reviews) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
};

// Seed some sample reviews so the page doesn't look empty
const SAMPLE_REVIEWS = {
  'anime-1': [
    {
      id: 'rev-sample-1',
      userId: 'user-bot-1',
      username: 'AnimeFan42',
      displayName: 'AnimeFan42',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnimeFan42',
      mediaId: 'anime-1',
      rating: 9,
      title: 'A masterpiece of storytelling',
      body: 'The way Isayama weaves the mystery of the titans with political intrigue and personal drama is unmatched. Every season raises the stakes further. The animation quality from MAPPA and WIT Studio is consistently stunning.',
      spoiler: false,
      likes: 24,
      likedBy: [],
      createdAt: '2024-12-15T10:30:00Z',
    },
    {
      id: 'rev-sample-2',
      userId: 'user-bot-3',
      username: 'TitanSlayer',
      displayName: 'TitanSlayer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TitanSlayer',
      mediaId: 'anime-1',
      rating: 10,
      title: 'Changed my view on anime forever',
      body: 'I came in expecting a simple action show and got a deeply philosophical story about freedom, war, and the cycle of hatred. The basement reveal is one of the best plot twists in fiction.',
      spoiler: true,
      likes: 18,
      likedBy: [],
      createdAt: '2024-11-20T14:15:00Z',
    },
  ],
  'game-1': [
    {
      id: 'rev-sample-3',
      userId: 'user-bot-5',
      username: 'GamerPro',
      displayName: 'GamerPro',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GamerPro',
      mediaId: 'game-1',
      rating: 10,
      title: 'The gold standard for action RPGs',
      body: 'FromSoftware has outdone themselves. The open world design is breathtaking, every boss fight is memorable, and the DLC Shadow of the Erdtree adds an incredible amount of content. A must-play for any RPG fan.',
      spoiler: false,
      likes: 31,
      likedBy: [],
      createdAt: '2024-10-05T08:00:00Z',
    },
  ],
  'movie-1': [
    {
      id: 'rev-sample-4',
      userId: 'user-bot-2',
      username: 'SciFiEnthusiast',
      displayName: 'SciFi Enthusiast',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SciFiFan',
      mediaId: 'movie-1',
      rating: 10,
      title: 'Villeneuve delivers a sci-fi epic',
      body: 'Dune: Part Two is a visual and narrative masterpiece. The desert sequences are breathtaking, the performances are stellar, and the story of Paul Atreides becomes even more compelling in its second chapter.',
      spoiler: false,
      likes: 42,
      likedBy: [],
      createdAt: '2024-09-12T16:45:00Z',
    },
  ],
};

// Merge sample reviews with stored ones
const initReviews = () => {
  const stored = loadReviews();
  const merged = { ...SAMPLE_REVIEWS };
  // Layer user reviews on top of samples
  for (const [mediaId, reviews] of Object.entries(stored)) {
    if (!merged[mediaId]) merged[mediaId] = [];
    // Add user reviews that aren't already in samples
    for (const rev of reviews) {
      if (!merged[mediaId].some(r => r.id === rev.id)) {
        merged[mediaId].push(rev);
      }
    }
  }
  return merged;
};

export const useReviewStore = create((set, get) => ({
  reviews: initReviews(), // { [mediaId]: Review[] }

  getReviewsForMedia: (mediaId) => {
    return get().reviews[mediaId] || [];
  },

  getUserReview: (mediaId, userId) => {
    const mediaReviews = get().reviews[mediaId] || [];
    return mediaReviews.find(r => r.userId === userId) || null;
  },

  addReview: (mediaId, userData, reviewData) => {
    const reviews = JSON.parse(JSON.stringify(get().reviews));
    if (!reviews[mediaId]) reviews[mediaId] = [];

    // Check if user already reviewed this media
    const existingIdx = reviews[mediaId].findIndex(r => r.userId === userData.id);
    
    const review = {
      id: uuidv4(),
      userId: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      avatar: userData.avatar,
      mediaId,
      rating: reviewData.rating || 0,
      title: reviewData.title || '',
      body: reviewData.body || '',
      spoiler: reviewData.spoiler || false,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      // Update existing review
      review.id = reviews[mediaId][existingIdx].id;
      review.likes = reviews[mediaId][existingIdx].likes;
      review.likedBy = reviews[mediaId][existingIdx].likedBy;
      review.createdAt = reviews[mediaId][existingIdx].createdAt;
      review.updatedAt = new Date().toISOString();
      reviews[mediaId][existingIdx] = review;
    } else {
      reviews[mediaId].unshift(review);
    }

    // Save only user-created reviews (filter out samples when saving)
    const toSave = {};
    for (const [mid, revs] of Object.entries(reviews)) {
      toSave[mid] = revs.filter(r => !r.id.startsWith('rev-sample-'));
    }
    saveReviews(toSave);
    set({ reviews });
    return review;
  },

  deleteReview: (mediaId, reviewId) => {
    const reviews = { ...get().reviews };
    if (!reviews[mediaId]) return;

    reviews[mediaId] = reviews[mediaId].filter(r => r.id !== reviewId);

    const toSave = {};
    for (const [mid, revs] of Object.entries(reviews)) {
      toSave[mid] = revs.filter(r => !r.id.startsWith('rev-sample-'));
    }
    saveReviews(toSave);
    set({ reviews });
  },

  toggleLike: (mediaId, reviewId, userId) => {
    const reviews = { ...get().reviews };
    if (!reviews[mediaId]) return;

    reviews[mediaId] = reviews[mediaId].map(r => {
      if (r.id !== reviewId) return r;
      const likedBy = [...r.likedBy];
      const idx = likedBy.indexOf(userId);
      if (idx >= 0) {
        likedBy.splice(idx, 1);
      } else {
        likedBy.push(userId);
      }
      return { ...r, likedBy, likes: likedBy.length };
    });

    const toSave = {};
    for (const [mid, revs] of Object.entries(reviews)) {
      toSave[mid] = revs.filter(r => !r.id.startsWith('rev-sample-'));
    }
    saveReviews(toSave);
    set({ reviews });
  },

  getAverageRating: (mediaId) => {
    const mediaReviews = get().reviews[mediaId] || [];
    const rated = mediaReviews.filter(r => r.rating > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
  },
}));
