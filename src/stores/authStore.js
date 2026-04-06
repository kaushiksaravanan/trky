// Auth store - username/password only, NO recovery
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationStore } from './notificationStore';

const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_users') || '[]');
  } catch { return []; }
};

const saveUsers = (users) => {
  localStorage.setItem('trky_users', JSON.stringify(users));
};

const loadSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem('trky_session') || 'null');
    if (session && session.userId) return session;
    return null;
  } catch { return null; }
};

const saveSession = (session) => {
  if (session) {
    localStorage.setItem('trky_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('trky_session');
  }
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'trky_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const TEST_ACCOUNT = {
  id: 'user-test-001',
  username: 'testuser',
  displayName: 'Test Account',
  bio: 'This is a pre-seeded test account. Email: test@trky.app | Password: test123456',
  favoriteCategories: ['anime', 'games', 'music'],
  avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=testuser',
  bannerColor: '#ec4899',
  joinedAt: '2025-01-01T00:00:00.000Z',
  hashedPassword: null, // Will be computed on first load
  stats: { totalTracked: 0, completed: 0, avgRating: 0 },
  following: [],
  followers: [],
};

// Seed test account on first visit (if no users exist)
const seedTestAccount = async () => {
  const users = loadUsers();
  if (users.length === 0) {
    const hash = await hashPassword('test123456');
    TEST_ACCOUNT.hashedPassword = hash;
    users.push(TEST_ACCOUNT);
    saveUsers(users);
  }
};
seedTestAccount();

export const useAuthStore = create((set, get) => {
  const session = loadSession();
  const users = loadUsers();
  const currentUser = session ? users.find(u => u.id === session.userId) : null;

  return {
    users,
    currentUser: currentUser || null,
    isAuthenticated: !!currentUser,
    isNewLogin: false,
    loginQuestions: [],
    showLoginPrompt: false,
    error: null,

    register: async (username, password, displayName, bio, favoriteCategories) => {
      const users = loadUsers();
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        set({ error: 'Username already taken. Choose another.' });
        return false;
      }
      if (username.length < 3 || username.length > 20) {
        set({ error: 'Username must be 3-20 characters.' });
        return false;
      }
      if (password.length < 6) {
        set({ error: 'Password must be at least 6 characters.' });
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        set({ error: 'Username can only contain letters, numbers, and underscores.' });
        return false;
      }

      const hashedPassword = await hashPassword(password);
      const newUser = {
        id: uuidv4(),
        username,
        displayName: displayName || username,
        bio: bio || '',
        favoriteCategories: favoriteCategories || [],
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`,
        bannerColor: '#ff6b9d',
        joinedAt: new Date().toISOString(),
        hashedPassword,
        stats: { totalTracked: 0, completed: 0, avgRating: 0 },
        following: [],
        followers: [],
      };

      users.push(newUser);
      saveUsers(users);
      const session = { userId: newUser.id, loginAt: Date.now() };
      saveSession(session);

      set({
        users,
        currentUser: newUser,
        isAuthenticated: true,
        isNewLogin: true,
        showLoginPrompt: false,
        error: null,
      });
      return true;
    },

    login: async (username, password) => {
      const users = loadUsers();
      const hashedPassword = await hashPassword(password);
      const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.hashedPassword === hashedPassword
      );

      if (!user) {
        set({ error: 'Invalid username or password. Note: passwords cannot be recovered.' });
        return false;
      }

      const session = { userId: user.id, loginAt: Date.now() };
      saveSession(session);

      set({
        currentUser: user,
        isAuthenticated: true,
        isNewLogin: true,
        showLoginPrompt: true,
        error: null,
      });
      return true;
    },

    logout: () => {
      saveSession(null);
      set({
        currentUser: null,
        isAuthenticated: false,
        isNewLogin: false,
        showLoginPrompt: false,
        loginQuestions: [],
        error: null,
      });
    },

    dismissLoginPrompt: () => {
      set({ showLoginPrompt: false, isNewLogin: false });
    },

    updateProfile: (updates) => {
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === get().currentUser?.id);
      if (idx === -1) return;
      const allowed = ['displayName', 'bio', 'bannerColor', 'favoriteCategories', 'avatar', 'favorites'];
      const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
      users[idx] = { ...users[idx], ...safe };
      saveUsers(users);
      set({ currentUser: users[idx], users });
    },

    getUserByUsername: (username) => {
      return get().users.find(u => u.username.toLowerCase() === username.toLowerCase());
    },

    followUser: (targetUserId) => {
      const users = loadUsers();
      const currentUserId = get().currentUser?.id;
      if (!currentUserId || currentUserId === targetUserId) return;

      const currentIdx = users.findIndex(u => u.id === currentUserId);
      const targetIdx = users.findIndex(u => u.id === targetUserId);
      if (currentIdx === -1 || targetIdx === -1) return;

      // Ensure arrays exist for legacy/imported accounts
      if (!Array.isArray(users[currentIdx].following)) users[currentIdx].following = [];
      if (!Array.isArray(users[targetIdx].followers)) users[targetIdx].followers = [];

      if (!users[currentIdx].following.includes(targetUserId)) {
        users[currentIdx].following.push(targetUserId);
        users[targetIdx].followers.push(currentUserId);
        useNotificationStore.getState().addNotification({
          type: 'social', title: 'Now Following',
          text: `You started following ${users[targetIdx].displayName}`,
        });
      } else {
        users[currentIdx].following = users[currentIdx].following.filter(id => id !== targetUserId);
        users[targetIdx].followers = users[targetIdx].followers.filter(id => id !== currentUserId);
      }

      saveUsers(users);
      set({ currentUser: users[currentIdx], users });
    },

    clearError: () => set({ error: null }),

    toggleFavorite: (mediaId) => {
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === get().currentUser?.id);
      if (idx === -1) return;
      const favorites = users[idx].favorites || [];
      if (favorites.includes(mediaId)) {
        users[idx].favorites = favorites.filter(id => id !== mediaId);
      } else if (favorites.length < 5) {
        users[idx].favorites = [...favorites, mediaId];
      }
      saveUsers(users);
      set({ currentUser: users[idx], users });
    },

    getFavorites: (userId) => {
      const user = get().users.find(u => u.id === userId);
      return user?.favorites || [];
    },

    reorderFavorites: (fromIndex, toIndex) => {
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === get().currentUser?.id);
      if (idx === -1) return;
      const favorites = [...(users[idx].favorites || [])];
      const [moved] = favorites.splice(fromIndex, 1);
      favorites.splice(toIndex, 0, moved);
      users[idx].favorites = favorites;
      saveUsers(users);
      set({ currentUser: users[idx], users });
    },
  };
});
