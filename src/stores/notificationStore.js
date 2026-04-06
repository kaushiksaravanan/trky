// Notification store for new releases and updates
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    type: 'release',
    title: 'New Episode Available',
    text: 'Attack on Titan S4 Episode 29 is now streaming',
    category: 'anime',
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'release',
    title: 'New Game Release',
    text: 'Elden Ring DLC: Shadow of the Erdtree is out now',
    category: 'games',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'social',
    title: 'New Follower',
    text: 'animefan42 started following you',
    category: null,
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: '4',
    type: 'update',
    title: 'Series Completed',
    text: 'Frieren: Beyond Journey\'s End has finished airing',
    category: 'anime',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: '5',
    type: 'release',
    title: 'New Album Drop',
    text: 'Your tracked artist released a new album',
    category: 'music',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

const loadNotifications = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('trky_notifications') || 'null');
    return stored || SAMPLE_NOTIFICATIONS;
  } catch { return SAMPLE_NOTIFICATIONS; }
};

const saveNotifications = (notifications) => {
  localStorage.setItem('trky_notifications', JSON.stringify(notifications));
};

export const useNotificationStore = create((set, get) => ({
  notifications: loadNotifications(),
  isOpen: false,

  togglePanel: () => set(s => ({ isOpen: !s.isOpen })),
  closePanel: () => set({ isOpen: false }),

  markAsRead: (id) => {
    set(s => {
      const notifications = s.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(notifications);
      return { notifications };
    });
  },

  markAllAsRead: () => {
    set(s => {
      const notifications = s.notifications.map(n => ({ ...n, read: true }));
      saveNotifications(notifications);
      return { notifications };
    });
  },

  addNotification: (notification) => {
    set(s => {
      const notifications = [
        { id: uuidv4(), time: new Date().toISOString(), read: false, ...notification },
        ...s.notifications,
      ];
      saveNotifications(notifications);
      return { notifications };
    });
  },

  clearAll: () => {
    saveNotifications([]);
    set({ notifications: [] });
  },
}));
