// Chat store - multi-fandom chatrooms with live updates
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { sampleChatrooms, sampleMessages } from '../data/sampleData';

const loadMessages = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('trky_messages') || 'null');
    const msgs = stored || sampleMessages;
    // Migrate legacy numeric reactions to array format
    return msgs.map(m => {
      if (!m.reactions) return m;
      const migrated = {};
      let needsMigration = false;
      for (const [emoji, value] of Object.entries(m.reactions)) {
        if (typeof value === 'number') {
          migrated[emoji] = Array.from({ length: value }, (_, i) => `_legacy_${m.id}_${i}`);
          needsMigration = true;
        } else {
          migrated[emoji] = value;
        }
      }
      return needsMigration ? { ...m, reactions: migrated } : m;
    });
  } catch { return sampleMessages; }
};

const saveMessages = (messages) => {
  // Cap stored messages to prevent localStorage quota overflow
  const MAX_STORED_MESSAGES = 500;
  const toStore = messages.length > MAX_STORED_MESSAGES
    ? messages.slice(-MAX_STORED_MESSAGES)
    : messages;
  localStorage.setItem('trky_messages', JSON.stringify(toStore));
};

const loadCustomChatrooms = () => {
  try {
    return JSON.parse(localStorage.getItem('trky_custom_chatrooms') || '[]');
  } catch { return []; }
};

const saveCustomChatrooms = (rooms) => {
  localStorage.setItem('trky_custom_chatrooms', JSON.stringify(rooms));
};

// Simple spam detection
const isSpam = (text) => {
  const spamPatterns = [
    /(.)\1{10,}/i, // repeated chars
    /(buy|free|click|win|prize|casino|viagra)/i, // spam keywords
    /https?:\/\/\S+\s*https?:\/\/\S+\s*https?:\/\/\S+/i, // multiple links
  ];
  return spamPatterns.some(p => p.test(text));
};

// Simple sentiment analysis (simulating Google/Meta open-source)
const analyzeSentiment = (text) => {
  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'fantastic', 'beautiful', 'excellent', 'wonderful', 'best', 'good', 'nice', 'cool', 'masterpiece', 'perfect', 'brilliant', 'incredible', 'fire', 'goat', 'peak'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'horrible', 'disgusting', 'trash', 'garbage', 'stupid', 'boring', 'cringe', 'mid', 'overrated'];
  const toxicWords = ['kill', 'die', 'kys', 'stfu', 'dumb'];

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let score = 0;
  let toxic = false;

  words.forEach(w => {
    if (positiveWords.includes(w)) score += 1;
    if (negativeWords.includes(w)) score -= 1;
    if (toxicWords.includes(w)) { score -= 2; toxic = true; }
  });

  if (toxic) return { label: 'toxic', score: -1, flagged: true };
  if (score > 1) return { label: 'positive', score: Math.min(score / 5, 1), flagged: false };
  if (score < -1) return { label: 'negative', score: Math.max(score / 5, -1), flagged: false };
  return { label: 'neutral', score: 0, flagged: false };
};

// Bot responses for simulated chat
const botResponses = [
  'I completely agree with that!',
  'Hot take but I respect it',
  'Has anyone seen the latest episode?',
  'This is why I love this community',
  'Just started watching this, no spoilers please!',
  'Unpopular opinion: the manga was better',
  'Can someone recommend something similar?',
  'The animation quality is insane',
  'I need to add this to my tracking list',
  'Peak fiction right here',
  'Who else is excited for the new season?',
  'This hits different at 2am',
  'Adding this to my watchlist rn',
  'The soundtrack alone is worth it',
  'Anyone want to start a watch party?',
];

const botUsers = [
  { id: 'user-bot-1', username: 'NarutoFan99' },
  { id: 'user-bot-2', username: 'AnimeLover' },
  { id: 'user-bot-3', username: 'SakuraPetal' },
  { id: 'user-bot-4', username: 'MangaReader' },
  { id: 'user-bot-5', username: 'WeebKing' },
  { id: 'user-bot-6', username: 'GamerTag42' },
  { id: 'user-bot-7', username: 'RPGmaster' },
  { id: 'user-bot-8', username: 'SilksongWaiter' },
  { id: 'user-bot-9', username: 'MelodyMaker' },
  { id: 'user-bot-10', username: 'SwiftFan' },
];

export const useChatStore = create((set, get) => ({
  chatrooms: sampleChatrooms,
  messages: loadMessages(),
  replyingTo: null,
  botInterval: null,
  customChatrooms: loadCustomChatrooms(),
  pinnedMessages: (() => { try { return JSON.parse(localStorage.getItem('trky_pinned') || '{}'); } catch { return {}; } })(),

  setReplyingTo: (message) => {
    set({ replyingTo: message });
  },

  clearReply: () => {
    set({ replyingTo: null });
  },

  getChatroomMessages: (chatroomId) => {
    return get().messages.filter(m => m.chatroomId === chatroomId);
  },

  searchMessages: (chatroomId, query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return get().messages
      .filter(m => m.chatroomId === chatroomId && !m.flagged && m.text.toLowerCase().includes(q))
      .map(m => m.id);
  },

  sendMessage: (chatroomId, userId, username, text, replyTo = null) => {
    // Spam check
    if (isSpam(text)) {
      return { success: false, reason: 'Message flagged as spam by auto-detection.' };
    }

    // Sentiment analysis
    const sentiment = analyzeSentiment(text);

    const newMessage = {
      id: uuidv4(),
      chatroomId,
      userId,
      username,
      text,
      timestamp: Date.now(),
      reactions: {},
      sentiment,
      replyTo: replyTo ? { id: replyTo.id, username: replyTo.username, text: replyTo.text.substring(0, 100) } : null,
    };

    if (sentiment.flagged) {
      newMessage.flagged = true;
      newMessage.flagReason = 'Toxic content detected by sentiment analysis';
    }

    const messages = [...get().messages, newMessage];
    saveMessages(messages);
    set({ messages, replyingTo: null });
    return { success: true, message: newMessage };
  },

  addReaction: (messageId, emoji, userId) => {
    const messages = get().messages.map(m => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        // Track reactions as arrays of userIds for toggle behavior
        if (Array.isArray(reactions[emoji])) {
          // New format: array of userIds
          if (reactions[emoji].includes(userId)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...reactions[emoji], userId];
          }
        } else if (typeof reactions[emoji] === 'number') {
          // Legacy format: preserve existing count as phantom users, add current user
          const phantomUsers = Array.from({ length: reactions[emoji] }, (_, i) => `_legacy_${i}`);
          reactions[emoji] = [...phantomUsers, userId];
        } else {
          reactions[emoji] = [userId];
        }
        return { ...m, reactions };
      }
      return m;
    });
    saveMessages(messages);
    set({ messages });
  },

  // Simulate bot messages for live chat feel
  startBotSimulation: (chatroomId) => {
    // Clear any existing timer before starting a new one
    const existing = get().botInterval;
    if (existing) clearTimeout(existing);

    const scheduleNext = () => {
      const timeout = setTimeout(() => {
        const bot = botUsers[Math.floor(Math.random() * botUsers.length)];
        const text = botResponses[Math.floor(Math.random() * botResponses.length)];

        const newMessage = {
          id: uuidv4(),
          chatroomId,
          userId: bot.id,
          username: bot.username,
          text,
          timestamp: Date.now(),
          reactions: {},
          sentiment: analyzeSentiment(text),
          replyTo: null,
          isBot: true,
        };

        set(state => {
          const MAX_MEMORY_MESSAGES = 1000;
          let messages = [...state.messages, newMessage];
          if (messages.length > MAX_MEMORY_MESSAGES) {
            messages = messages.slice(-MAX_MEMORY_MESSAGES);
          }
          saveMessages(messages);
          return { messages };
        });

        // Schedule next with a fresh random delay
        scheduleNext();
      }, 3000 + Math.random() * 7000);

      set({ botInterval: timeout });
    };

    scheduleNext();
  },

  stopBotSimulation: () => {
    const timer = get().botInterval;
    if (timer) clearTimeout(timer);
    set({ botInterval: null });
  },

  getChatroomById: (id) => {
    const all = [...get().chatrooms, ...get().customChatrooms];
    return all.find(c => c.id === id);
  },

  searchChatrooms: (query) => {
    const q = query.toLowerCase();
    const all = [...get().chatrooms, ...get().customChatrooms];
    return all.filter(
      c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
  },

  getAllChatrooms: () => {
    return [...get().chatrooms, ...get().customChatrooms];
  },

  createChatroom: (data) => {
    const newRoom = {
      id: `cr-custom-${uuidv4().slice(0, 8)}`,
      name: data.name,
      description: data.description || '',
      category: data.category || 'general',
      members: 1,
      color: data.color || '#ff6b9d',
      createdBy: data.userId,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const custom = [...get().customChatrooms, newRoom];
    saveCustomChatrooms(custom);
    set({ customChatrooms: custom });
    return newRoom;
  },

  deleteChatroom: (chatroomId) => {
    const custom = get().customChatrooms.filter(c => c.id !== chatroomId);
    saveCustomChatrooms(custom);
    // Also remove messages for this chatroom
    const messages = get().messages.filter(m => m.chatroomId !== chatroomId);
    saveMessages(messages);
    set({ customChatrooms: custom, messages });
  },

  // Pinned messages
  pinMessage: (chatroomId, messageId) => {
    const pinned = { ...get().pinnedMessages };
    const existing = pinned[chatroomId] || [];
    if (!existing.includes(messageId)) {
      pinned[chatroomId] = [messageId, ...existing];
    }
    try { localStorage.setItem('trky_pinned', JSON.stringify(pinned)); } catch {}
    set({ pinnedMessages: pinned });
  },

  unpinMessage: (chatroomId, messageId) => {
    const pinned = { ...get().pinnedMessages };
    if (!pinned[chatroomId]) return;
    pinned[chatroomId] = pinned[chatroomId].filter(id => id !== messageId);
    try { localStorage.setItem('trky_pinned', JSON.stringify(pinned)); } catch {}
    set({ pinnedMessages: pinned });
  },

  getPinnedMessages: (chatroomId) => {
    const pinnedIds = get().pinnedMessages[chatroomId] || [];
    const messages = get().messages;
    return pinnedIds.map(id => messages.find(m => m.id === id)).filter(Boolean);
  },

  isMessagePinned: (chatroomId, messageId) => {
    const pinnedIds = get().pinnedMessages[chatroomId] || [];
    return pinnedIds.includes(messageId);
  },
}));
