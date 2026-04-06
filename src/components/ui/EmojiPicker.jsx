import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'Gestures': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','💪','🦾','🦿'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  'Fire': ['🔥','⚡','✨','💫','🌟','⭐','💥','💢','💯','🎯','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎪','🎭','🎨'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞'],
  'Food': ['🍕','🍔','🍟','🌮','🌯','🥗','🍿','🍩','🍪','🍰','🎂','🧁','🍫','🍬','🍭','🍮','🍯','🍵','☕','🧋','🍺','🍻','🥂','🍷'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [search, setSearch] = useState('');

  const filteredEmojis = search
    ? (() => {
        const q = search.toLowerCase();
        const matched = [];
        for (const [catName, emojis] of Object.entries(EMOJI_CATEGORIES)) {
          if (catName.toLowerCase().includes(q)) {
            matched.push(...emojis);
          }
        }
        return matched.length > 0 ? matched : ALL_EMOJIS;
      })()
    : EMOJI_CATEGORIES[activeCategory] || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 8,
        width: 320,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        zIndex: 50,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Emoji</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', padding: 2,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 12, color: 'var(--text-primary)', width: '100%',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: 2,
        padding: '6px 8px',
        borderBottom: '1px solid var(--border-light)',
        overflowX: 'auto',
      }}>
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSearch(''); }}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeCategory === cat && !search ? 'var(--accent-soft)' : 'transparent',
              color: activeCategory === cat && !search ? 'var(--text-accent)' : 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 2,
        padding: 8,
        maxHeight: 200,
        overflowY: 'auto',
      }}>
        {filteredEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.1s',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-hover)';
              e.target.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
