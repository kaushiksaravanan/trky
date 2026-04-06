// Collections store - custom named lists
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const loadCollections = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_collections') || '{}');
  } catch { return {}; }
};

const saveCollections = (collections) => {
  localStorage.setItem('trky_collections', JSON.stringify(collections));
};

export const useCollectionStore = create((set, get) => ({
  collections: loadCollections(), // { [userId]: [ { id, name, description, color, icon, items: [mediaId], createdAt, updatedAt } ] }

  getUserCollections: (userId) => {
    return get().collections[userId] || [];
  },

  getCollectionById: (userId, collectionId) => {
    const userCollections = get().collections[userId] || [];
    return userCollections.find(c => c.id === collectionId) || null;
  },

  createCollection: (userId, data) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) collections[userId] = [];

    const newCollection = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      color: data.color || '#ec4899',
      icon: data.icon || 'list',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collections[userId].push(newCollection);
    saveCollections(collections);
    set({ collections });
    return newCollection;
  },

  updateCollection: (userId, collectionId, data) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) return;

    collections[userId] = collections[userId].map(c => {
      if (c.id === collectionId) {
        return { ...c, ...data, updatedAt: new Date().toISOString() };
      }
      return c;
    });

    saveCollections(collections);
    set({ collections });
  },

  deleteCollection: (userId, collectionId) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) return;

    collections[userId] = collections[userId].filter(c => c.id !== collectionId);
    saveCollections(collections);
    set({ collections });
  },

  addToCollection: (userId, collectionId, mediaId) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) return false;

    const idx = collections[userId].findIndex(c => c.id === collectionId);
    if (idx === -1) return false;
    if (collections[userId][idx].items.includes(mediaId)) return false;

    collections[userId][idx] = {
      ...collections[userId][idx],
      items: [...collections[userId][idx].items, mediaId],
      updatedAt: new Date().toISOString(),
    };
    saveCollections(collections);
    set({ collections });
    return true;
  },

  removeFromCollection: (userId, collectionId, mediaId) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) return;

    const idx = collections[userId].findIndex(c => c.id === collectionId);
    if (idx === -1) return;

    collections[userId][idx] = {
      ...collections[userId][idx],
      items: collections[userId][idx].items.filter(id => id !== mediaId),
      updatedAt: new Date().toISOString(),
    };
    saveCollections(collections);
    set({ collections });
  },

  reorderCollection: (userId, collectionId, fromIndex, toIndex) => {
    const collections = JSON.parse(JSON.stringify(get().collections));
    if (!collections[userId]) return;

    const idx = collections[userId].findIndex(c => c.id === collectionId);
    if (idx === -1) return;

    const items = [...collections[userId][idx].items];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    collections[userId][idx] = { ...collections[userId][idx], items, updatedAt: new Date().toISOString() };

    saveCollections(collections);
    set({ collections });
  },

  getCollectionsForMedia: (userId, mediaId) => {
    const userCollections = get().collections[userId] || [];
    return userCollections.filter(c => c.items.includes(mediaId));
  },
}));
