import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { timeAgo } from '../utils/helpers';
import EmojiPicker from '../components/ui/EmojiPicker';
import { ArrowLeft, Send, Reply, Smile, X, Shield, AlertTriangle, Hash, Users, ImageIcon, Film, Pin, PinOff, ChevronDown, ChevronUp, Search as SearchIcon } from 'lucide-react';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '👍', '💯'];

// Regex to detect image URLs in messages
const IMAGE_URL_REGEX = /https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(\?\S*)?/gi;

// GIF categories with curated animated GIF URLs
const GIF_CATEGORIES = {
  'Reactions': [
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjJmNnYxZWdxbHB0eGR1MWVhZGNyMXAyN2pxcHowNXNzcTcyMnpjZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif', label: 'Thumbs Up' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2VrcjY5NnB1Y2UwcGVmcmlhMmtwM2V1NDk3YWlrOGd0dG14aWFjbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHI8WJv4x6UPDB6/giphy.gif', label: 'Laughing' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDhyNDl2OTQ5ZDhjczVsMjhtanQ4N2M0cmlpdHBqZDhxcmZ4eXFpaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5VKbvrjxpVJCM/giphy.gif', label: 'Mind Blown' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXc5MTdlaHJuZ3Jja3BtMWx0dGZqbHB6dWdpNno0Z3piNjZyMXhudCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GCvktC0KFy9l6/giphy.gif', label: 'Clapping' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjBjMGE1dmVodHVwdHI5azF2cTh1aGp0MGV1dmpjYm9ianV2OG1qbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjI6SIIHBdRxXI40/giphy.gif', label: 'Heart Eyes' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjgxY2dyNGhpcjFsbjdoeDY5MWN5NXV0dGFoeGVjMXJ6OGp2Y3dlaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d2lcHJTG5Tscg/giphy.gif', label: 'Wow' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG1tZjhsd296NnlraGNub3pqM2ExYzZjcGF3MW54ZnR2YndxcjhsayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l1J9u3TZfpmeDLkD6/giphy.gif', label: 'Sad' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTRnbWF2bnJ6cjdpZGhhanJhMjVxYjNzejlrcjNrc3p2Z3p3d2g0YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xeJpnrWC3XWblEk/giphy.gif', label: 'Facepalm' },
  ],
  'Anime': [
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTNiZjloeHJqY2JjaDNsNGw5bnNyY3k4dDBma2V5bmFmenJmeWI5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WUq1cg9K7uzHa/giphy.gif', label: 'Excited' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXRyaXJ3eHN3NmkzMjZvZHA3NTVlanN2MG5reXpoYjhxeXV4ZWRueCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tsX3YMWYzDPjAARfeg/giphy.gif', label: 'Sparkle' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnlhbGFhdXZncGdnMWR3aXRyZGRzODEzdW9uYnhuaXpzeGhsMTRleSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/o6S51npJYQM48/giphy.gif', label: 'Cry' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2RpbGw4cHV5OGp2bGlkNmFyaWp3Z25iaHEzOXowZG4wNHR6c2N3aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFgzrTt798d2w/giphy.gif', label: 'Power' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjZkM3Z3aWVkMWlvenR0Y2F0NGp3dGNqd3Q3c2Q2NGdqcjE2cDl5MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BmmfETghGQBlqt/giphy.gif', label: 'Shocked' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGI2OTdpYmtoYXRwYnp0bzNhM252N2ljMmN0bjZ3OWN5dHJheGc3MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7ZetIsjtbkgNE1I4/giphy.gif', label: 'Nod' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYW9yNnIwdmhleHY0bGJ0eXI2czlsajA3dThqNnB5MDJsajFkbGY1bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGGDNsLvqsBOhuU0/giphy.gif', label: 'Wave' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWZmMG9hZWF6bGE1dnBhYnl4cWRjYXRtZDZtY2N0MHQ4MzA0Zzl6YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/14urMYvFxIKEms/giphy.gif', label: 'Blush' },
  ],
  'Gaming': [
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2l6OWFhOWd6amhteDBycDlrODBnaGJjM2ppODZpb2RyMjcyZjh5ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8m4R4pvViWtRzbloJ1/giphy.gif', label: 'GG' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzVnNHBrbHRjY284M3BzeDVtaG5scjRyZjRmZGhndmJneGd4MHphYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iDJQRjTCenF7A4BRyA/giphy.gif', label: 'Rage' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3JibGtqaDd5MWl0OHZmZ2Eycm5jMW83N2NnYnFrcXNocjF5Z3RtYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/artj92V8o75VPL7AeQ/giphy.gif', label: 'Dance' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW16ZGZoM2ZveGhjbThyYXJhbGQxODR3NHB5dXZvaDJxOGNuNzBtNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26u4lOMA8JKSnL9Uk/giphy.gif', label: 'Victory' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmhiYjVidjNlODZkNGZqYjN5NG14dG41NmltZGM3MXN0NDBzYTFtcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Q8bEDnGVwuMwPhYbEj/giphy.gif', label: 'RIP' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmV5NnB2ZHEyZm10cG56ZGNyMW55NjEyb3Q3ZnQ5bnV5Y3NhZWM1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26gsjCZpPolPr3sBy/giphy.gif', label: 'Focus' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXFtcnV6cmo0dWEwcTQyNGYwdXE2enNpc2I5aTkzb2Z0ZmZ3NGJ5MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LmNwrBhejkK9EFP504/giphy.gif', label: 'Let\'s Go' },
    { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDhvMDVrbjh5NmxjcjR4aWJuMWNyeHg5cWthdHBjd3JyOW43bGV6OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YoB1eEFB6FZ1m/giphy.gif', label: 'Headshot' },
  ],
};

// Parse message text and render images inline
function MessageText({ text }) {
  const imageMatches = text.match(IMAGE_URL_REGEX);
  if (!imageMatches) return <>{text}</>;

  // Split text around image URLs
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(IMAGE_URL_REGEX.source, 'gi');
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'image' ? (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: 6, marginBottom: 4 }}
          >
            <img
              src={part.content}
              alt="shared image"
              className="chat-embedded-image"
              onClick={() => window.open(part.content, '_blank')}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}

export default function ChatViewPage() {
  const { chatroomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const {
    getChatroomById, getChatroomMessages, sendMessage, addReaction,
    replyingTo, setReplyingTo, clearReply,
    startBotSimulation, stopBotSimulation,
    pinMessage, unpinMessage, getPinnedMessages, isMessagePinned,
    searchMessages,
  } = useChatStore();

  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [gifCategory, setGifCategory] = useState('Reactions');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState(0);
  const [failedGifs, setFailedGifs] = useState(new Set());
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const chatroom = getChatroomById(chatroomId);
  const messages = getChatroomMessages(chatroomId);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Start bot simulation
  useEffect(() => {
    if (chatroomId) {
      startBotSimulation(chatroomId);
    }
    return () => stopBotSimulation();
  }, [chatroomId]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyingTo]);

  // Simulate typing indicator
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.isBot) {
        setIsTyping(false);
      }
    }
    // Random typing indicator
    const typingTimeout = { current: null };
    const interval = setInterval(() => {
      setIsTyping(true);
      typingTimeout.current = setTimeout(() => setIsTyping(false), 1500 + Math.random() * 2000);
    }, 5000 + Math.random() * 8000);
    return () => { clearInterval(interval); if (typingTimeout.current) clearTimeout(typingTimeout.current); };
  }, [messages.length]);

  // Message search
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchMessages(chatroomId, searchQuery);
      setSearchResults(results);
      setActiveSearchIdx(results.length > 0 ? results.length - 1 : 0);
    } else {
      setSearchResults([]);
      setActiveSearchIdx(0);
    }
  }, [searchQuery, chatroomId, messages.length]);

  // Scroll to active search result
  useEffect(() => {
    if (searchResults.length > 0 && searchResults[activeSearchIdx]) {
      const el = document.getElementById(`msg-${searchResults[activeSearchIdx]}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSearchIdx, searchResults]);

  if (!chatroom) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-title">Chatroom not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>Back to Chatrooms</button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!text.trim()) return;
    setError(null);

    const result = sendMessage(chatroomId, currentUser.id, currentUser.username, text.trim(), replyingTo);
    if (result.success) {
      setText('');
      setShowEmoji(false);
      setShowGifPicker(false);
      setShowImageInput(false);
    } else {
      setError(result.reason);
    }
  };

  const handleSendImage = () => {
    if (!imageUrl.trim()) return;
    const msg = imageUrl.trim();
    setError(null);
    const result = sendMessage(chatroomId, currentUser.id, currentUser.username, msg, replyingTo);
    if (result.success) {
      setImageUrl('');
      setShowImageInput(false);
    } else {
      setError(result.reason);
    }
  };

  const handleGifSelect = (gifUrl) => {
    setError(null);
    const result = sendMessage(chatroomId, currentUser.id, currentUser.username, gifUrl, replyingTo);
    if (result.success) {
      setShowGifPicker(false);
    } else {
      setError(result.reason);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji, currentUser.id);
    setShowReactions(null);
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const onlineCount = Math.floor((chatroom.members || 0) * 0.12);
  const pinnedMessages = getPinnedMessages(chatroomId);

  // Build unique user list from messages
  const chatUsers = (() => {
    const userMap = new Map();
    messages.forEach(msg => {
      if (!userMap.has(msg.userId)) {
        userMap.set(msg.userId, {
          id: msg.userId,
          username: msg.username,
          isBot: !!msg.isBot,
          lastSeen: msg.timestamp,
          messageCount: 1,
        });
      } else {
        const u = userMap.get(msg.userId);
        u.messageCount += 1;
        if (msg.timestamp > u.lastSeen) u.lastSeen = msg.timestamp;
      }
    });
    // Add current user if not in messages
    if (currentUser && !userMap.has(currentUser.id)) {
      userMap.set(currentUser.id, {
        id: currentUser.id,
        username: currentUser.username,
        isBot: false,
        lastSeen: Date.now(),
        messageCount: 0,
      });
    }
    return Array.from(userMap.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  })();

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/chat')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="chat-header-name">
              <Hash size={16} style={{ color: 'var(--text-muted)', verticalAlign: 'middle', marginRight: 2 }} />
              {chatroom.name}
            </div>
            <div className="chat-header-members">
              <span className="online-dot" /> {onlineCount} online -- {(chatroom.members || 0).toLocaleString()} members
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pinnedMessages.length > 0 && (
            <motion.button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPinned(!showPinned)}
              whileHover={{ scale: 1.05 }}
              style={{ fontSize: 12, color: 'var(--accent)', gap: 4, display: 'flex', alignItems: 'center' }}
            >
              <Pin size={14} /> {pinnedMessages.length}
            </motion.button>
          )}
          <motion.button
            className="btn btn-ghost btn-icon"
            onClick={() => { setShowSearch(!showSearch); if (showSearch) { setSearchQuery(''); setSearchResults([]); } }}
            whileHover={{ scale: 1.05 }}
            style={{ color: showSearch ? 'var(--accent)' : 'var(--text-muted)' }}
            title="Search messages"
          >
            <SearchIcon size={16} />
          </motion.button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Shield size={14} style={{ color: 'var(--green-400)' }} />
            AI Moderated
          </div>
          <motion.button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowUserList(!showUserList)}
            whileHover={{ scale: 1.05 }}
            style={{ color: showUserList ? 'var(--accent)' : 'var(--text-muted)' }}
            title="Toggle user list"
          >
            <Users size={16} />
            <span style={{ fontSize: 12, marginLeft: 4 }}>{chatUsers.length}</span>
          </motion.button>
        </div>
      </div>

      {/* Pinned messages banner */}
      <AnimatePresence>
        {showPinned && pinnedMessages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}
          >
            <div style={{ padding: '8px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Pin size={12} /> Pinned Messages ({pinnedMessages.length})
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPinned(false)} style={{ padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {pinnedMessages.map(msg => (
                  <div key={msg.id} style={{
                    padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--accent)', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>{msg.username}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{msg.text?.substring(0, 100)}{msg.text?.length > 100 ? '...' : ''}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => unpinMessage(chatroomId, msg.id)}
                      style={{ padding: 2, flexShrink: 0 }}
                      title="Unpin"
                    >
                      <PinOff size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="chat-search-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <SearchIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <>
                <span className="search-count">{activeSearchIdx + 1}/{searchResults.length}</span>
                <button className="search-nav-btn" onClick={() => setActiveSearchIdx(i => i > 0 ? i - 1 : searchResults.length - 1)} title="Previous">
                  <ChevronUp size={14} />
                </button>
                <button className="search-nav-btn" onClick={() => setActiveSearchIdx(i => i < searchResults.length - 1 ? i + 1 : 0)} title="Next">
                  <ChevronDown size={14} />
                </button>
              </>
            )}
            {searchQuery && searchResults.length === 0 && (
              <span className="search-count">No results</span>
            )}
            <button className="search-nav-btn" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} title="Close">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat body with optional user list sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Messages - Twitch-style scrolling */}
      <div className="chat-messages" ref={messagesContainerRef} style={{ flex: 1 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-title">No messages yet</div>
            <div className="empty-state-text">Be the first to say something!</div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`chat-message ${msg.flagged ? 'flagged' : ''}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              layout
              style={searchResults.includes(msg.id) ? {
                background: searchResults[activeSearchIdx] === msg.id
                  ? 'rgba(236, 72, 153, 0.12)'
                  : 'rgba(236, 72, 153, 0.05)',
                borderLeft: searchResults[activeSearchIdx] === msg.id ? '3px solid var(--accent)' : undefined,
              } : undefined}
            >
              <div className="chat-message-avatar">
                <img
                  src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${msg.username}`}
                  alt={msg.username}
                />
              </div>
              <div className="chat-message-content">
                {/* Reply reference */}
                {msg.replyTo && (
                  <div className="chat-message-reply-ref">
                    <Reply size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    <strong>{msg.replyTo.username}</strong>: {msg.replyTo.text}
                  </div>
                )}
                <div className="chat-message-header">
                  <span className="chat-message-username">{msg.username}</span>
                  <span className="chat-message-time">{timeAgo(msg.timestamp)}</span>
                  {msg.sentiment && msg.sentiment.label !== 'neutral' && (
                    <span className={`sentiment-badge sentiment-${msg.sentiment.label}`}>
                      {msg.sentiment.label}
                    </span>
                  )}
                </div>
                <div className="chat-message-text">
                  {msg.flagged ? (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Message flagged by AI moderation
                    </span>
                  ) : <MessageText text={msg.text} />}
                </div>

                {/* Reactions */}
                {Object.keys(msg.reactions || {}).length > 0 && (
                  <div className="chat-message-reactions">
                    {Object.entries(msg.reactions).map(([emoji, value]) => {
                      const count = Array.isArray(value) ? value.length : value;
                      const isOwn = Array.isArray(value) && currentUser && value.includes(currentUser.id);
                      if (count === 0) return null;
                      return (
                        <motion.button
                          key={emoji}
                          className={`chat-reaction${isOwn ? ' own' : ''}`}
                          onClick={() => handleReaction(msg.id, emoji)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {emoji} {count}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="chat-message-actions">
                <button
                  className="chat-action-btn"
                  onClick={() => setReplyingTo(msg)}
                  title="Reply"
                >
                  <Reply size={12} />
                </button>
                <button
                  className="chat-action-btn"
                  onClick={() => {
                    if (isMessagePinned(chatroomId, msg.id)) {
                      unpinMessage(chatroomId, msg.id);
                    } else {
                      pinMessage(chatroomId, msg.id);
                    }
                  }}
                  title={isMessagePinned(chatroomId, msg.id) ? 'Unpin' : 'Pin'}
                  style={{ color: isMessagePinned(chatroomId, msg.id) ? 'var(--accent)' : undefined }}
                >
                  {isMessagePinned(chatroomId, msg.id) ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    className="chat-action-btn"
                    onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                    title="React"
                  >
                    <Smile size={12} />
                  </button>
                  <AnimatePresence>
                    {showReactions === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                          position: 'absolute', right: 0, top: '100%', marginTop: 4,
                          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)', padding: 6, display: 'flex', gap: 4,
                          boxShadow: 'var(--shadow-lg)', zIndex: 10,
                        }}
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <motion.button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.85 }}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 16, padding: 4, borderRadius: 4,
                            }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="typing-indicator"
            >
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Someone is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* User list sidebar */}
      <AnimatePresence>
        {showUserList && (
          <motion.div
            className="chat-user-list-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              borderLeft: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div style={{ width: 220, padding: 12, height: '100%', overflowY: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                Users in Chat ({chatUsers.length})
              </div>

              {/* Online section */}
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-400)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="online-dot" /> Online — {Math.min(chatUsers.filter(u => !u.isBot).length, onlineCount)}
              </div>
              {chatUsers.filter(u => !u.isBot).map(user => (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)', marginBottom: 2,
                  cursor: 'default',
                }}>
                  <img
                    src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`}
                    alt={user.username}
                    style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: user.id === currentUser?.id ? 'var(--accent)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.username} {user.id === currentUser?.id && '(you)'}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{user.messageCount} msgs</span>
                </div>
              ))}

              {/* Bots section */}
              {chatUsers.some(u => u.isBot) && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--violet-400)', marginTop: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Community — {chatUsers.filter(u => u.isBot).length}
                  </div>
                  {chatUsers.filter(u => u.isBot).map(user => (
                    <div key={user.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)', marginBottom: 2,
                    }}>
                      <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.username}`}
                        alt={user.username}
                        style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, opacity: 0.7 }}
                      />
                      <div style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {user.username}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div> {/* end chat body wrapper */}

      {/* Input area */}
      <div className="chat-input-area">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 12, color: 'var(--red-400)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <AlertTriangle size={12} /> {error}
          </motion.div>
        )}

        <AnimatePresence>
          {replyingTo && (
            <motion.div
              className="chat-reply-preview"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Reply size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: 'var(--text-accent)', flexShrink: 0 }}>
                {replyingTo.username}
              </span>
              <span className="chat-reply-preview-text">{replyingTo.text}</span>
              <button className="chat-reply-preview-close" onClick={clearReply}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GIF Picker Panel */}
        <AnimatePresence>
          {showGifPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="chat-gif-picker"
            >
              <div className="chat-gif-picker-header">
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>GIFs</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowGifPicker(false)} style={{ padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
              <div className="chat-gif-categories">
                {Object.keys(GIF_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    className={`chip ${gifCategory === cat ? 'active' : ''}`}
                    onClick={() => setGifCategory(cat)}
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="chat-gif-grid">
                {GIF_CATEGORIES[gifCategory].map((gif, idx) => (
                  <motion.button
                    key={idx}
                    className="chat-gif-item"
                    onClick={() => handleGifSelect(gif.url)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={gif.label}
                  >
                    {failedGifs.has(gif.url) ? (
                      <div className="chat-gif-placeholder">
                        <span style={{ fontSize: 28 }}>🎬</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{gif.label}</span>
                      </div>
                    ) : (
                      <img
                        src={gif.url}
                        alt={gif.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={() => setFailedGifs(prev => new Set([...prev, gif.url]))}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
                Powered by Giphy
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image URL Input */}
        <AnimatePresence>
          {showImageInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}
            >
              <ImageIcon size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                type="text"
                className="chat-input"
                placeholder="Paste image URL (png, jpg, gif, webp)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendImage(); }}
                style={{ flex: 1, height: 36, fontSize: 12 }}
              />
              <motion.button
                className="btn btn-primary"
                onClick={handleSendImage}
                disabled={!imageUrl.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ height: 36, padding: '0 12px', fontSize: 12 }}
              >
                Send
              </motion.button>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowImageInput(false); setImageUrl(''); }} style={{ padding: 4 }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chat-input-row">
          <div style={{ position: 'relative', flex: 1, display: 'flex', gap: 8 }}>
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={`Message #${chatroom.name}...`}
              aria-label={`Type a message in ${chatroom.name}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => { setShowGifPicker(!showGifPicker); setShowEmoji(false); setShowImageInput(false); }}
                style={{ height: 44, color: showGifPicker ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}
                title="GIF picker"
              >
                <Film size={18} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => { setShowImageInput(!showImageInput); setShowGifPicker(false); setShowEmoji(false); }}
                style={{ height: 44, color: showImageInput ? 'var(--accent)' : 'var(--text-muted)' }}
                title="Share image URL"
              >
                <ImageIcon size={18} />
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => { setShowEmoji(!showEmoji); setShowGifPicker(false); setShowImageInput(false); }}
                  style={{ height: 44, color: showEmoji ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  <Smile size={20} />
                </button>
                <AnimatePresence>
                  {showEmoji && (
                    <EmojiPicker
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmoji(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <motion.button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!text.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
