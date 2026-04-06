import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore, ACCENT_PRESETS } from '../stores/themeStore';
import { CATEGORIES, CATEGORY_LABELS, PLATFORM_LINKS } from '../data/sampleData';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import { Save, Palette, User, Shield, Link2, ExternalLink, Check, Moon, Sun, Keyboard, Download, Upload } from 'lucide-react';

const BANNER_COLORS = ['#ff6b9d', '#ec4899', '#db2777', '#a78bfa', '#8b5cf6', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];

export default function SettingsPage() {
  const { currentUser, updateProfile } = useAuthStore();
  const { theme, toggleTheme, accent, setAccent } = useThemeStore();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [bannerColor, setBannerColor] = useState(currentUser?.bannerColor || '#ff6b9d');
  const [favoriteCategories, setFavoriteCategories] = useState(currentUser?.favoriteCategories || []);
  const isDark = theme === 'dark';

  const toggleCategory = (cat) => {
    setFavoriteCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    updateProfile({ displayName, bio, bannerColor, favoriteCategories });
    toast.success('Settings saved! Your profile has been updated.');
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Customize your profile and preferences</div>
      </div>

      <div className="page-body" style={{ maxWidth: 600 }}>
        <StaggerContainer staggerDelay={0.08}>
          {/* Profile */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <User size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Profile</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Username (cannot be changed)</label>
                  <input type="text" className="input" value={currentUser?.username || ''} disabled style={{ opacity: 0.5 }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Display Name</label>
                  <input
                    type="text"
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Bio</label>
                  <textarea
                    className="input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people about yourself..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Appearance / Theme */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Palette size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Appearance</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>Theme</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button
                    onClick={() => { if (isDark) toggleTheme(); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)',
                      border: !isDark ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                      background: !isDark ? 'var(--accent-soft)' : 'var(--bg-input)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Sun size={20} style={{ color: !isDark ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: !isDark ? 'var(--accent)' : 'var(--text-muted)' }}>Light</span>
                  </motion.button>
                  <motion.button
                    onClick={() => { if (!isDark) toggleTheme(); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)',
                      border: isDark ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                      background: isDark ? 'var(--accent-soft)' : 'var(--bg-input)',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Moon size={20} style={{ color: isDark ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'var(--accent)' : 'var(--text-muted)' }}>Dark</span>
                  </motion.button>
                </div>
              </div>

              <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>Profile Banner Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BANNER_COLORS.map(color => (
                  <motion.button
                    key={color}
                    onClick={() => setBannerColor(color)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: color, border: bannerColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
              <motion.div
                layout
                style={{ marginTop: 12, height: 60, borderRadius: 'var(--radius-md)', background: `linear-gradient(135deg, ${bannerColor}, var(--violet-400))` }}
              />

              <div style={{ marginTop: 24 }}>
                <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>Accent Color</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Changes buttons, links, and highlights across the entire app.
                </p>
                <div className="color-picker-grid">
                  {Object.entries(ACCENT_PRESETS).map(([name, preset]) => (
                    <motion.button
                      key={name}
                      className={`color-swatch ${accent === name ? 'active' : ''}`}
                      onClick={() => setAccent(name)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      style={{ background: preset.accent }}
                      title={name.charAt(0).toUpperCase() + name.slice(1)}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Current: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{accent}</span>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Favorite categories */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Shield size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Favorite Categories</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <motion.button
                    key={cat}
                    className={`chip ${favoriteCategories.includes(cat) ? 'active' : ''}`}
                    onClick={() => toggleCategory(cat)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </motion.button>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Platform integrations / portal */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Link2 size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Platform Portal</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Quick links to your favorite platforms. trky acts as a portal to all your media platforms.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(PLATFORM_LINKS).map(([name, url]) => (
                  <motion.a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="platform-link"
                    style={{ justifyContent: 'space-between' }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span>{name}</span>
                    <ExternalLink size={12} />
                  </motion.a>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Privacy notice */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(52, 211, 153, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield size={18} style={{ color: 'var(--green-400)' }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-400)' }}>Privacy</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                trky does not track your browsing, does not sell your data, and does not use cookies for advertising.
                All your data is stored locally in your browser. Chatrooms have no logging beyond what's shown in-app.
                AI moderation uses open-source sentiment analysis only for spam/toxicity detection.
              </p>
            </div>
          </StaggerItem>

          {/* Keyboard shortcuts */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Keyboard size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Keyboard Shortcuts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { keys: 'Ctrl + Shift + H', action: 'Go to Home' },
                  { keys: 'Ctrl + Shift + B', action: 'Go to Browse' },
                  { keys: 'Ctrl + Shift + K', action: 'Go to Search' },
                  { keys: 'Ctrl + Shift + L', action: 'Go to My List' },
                  { keys: 'Ctrl + Shift + M', action: 'Go to Chatrooms' },
                  { keys: '/', action: 'Focus search bar' },
                ].map(({ keys, action }) => (
                  <div key={keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{action}</span>
                    <kbd style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                    }}>
                      {keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Data management */}
          <StaggerItem>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Download size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Data Management</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                All your data is stored locally. Export it to keep a backup or import to restore.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <motion.button
                  className="btn btn-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Strip sensitive data from user records before export
                    const rawUsers = localStorage.getItem('trky_users');
                    let safeUsers = rawUsers;
                    try {
                      const parsed = JSON.parse(rawUsers || '[]');
                      const stripped = parsed.map(({ hashedPassword, ...u }) => u);
                      safeUsers = JSON.stringify(stripped);
                    } catch {}
                    const data = {
                      trky_users: safeUsers,
                      trky_tracking: localStorage.getItem('trky_tracking'),
                      trky_theme: localStorage.getItem('trky_theme'),
                      trky_accent: localStorage.getItem('trky_accent'),
                      trky_messages: localStorage.getItem('trky_messages'),
                      trky_custom_chatrooms: localStorage.getItem('trky_custom_chatrooms'),
                      trky_pinned: localStorage.getItem('trky_pinned'),
                      trky_collections: localStorage.getItem('trky_collections'),
                      trky_reviews: localStorage.getItem('trky_reviews'),
                      trky_notifications: localStorage.getItem('trky_notifications'),
                      trky_recent_searches: localStorage.getItem('trky_recent_searches'),
                      trky_custom_media: localStorage.getItem('trky_custom_media'),
                      trky_browse_viewMode: localStorage.getItem('trky_browse_viewMode'),
                      trky_browse_sortBy: localStorage.getItem('trky_browse_sortBy'),
                      trky_list_viewMode: localStorage.getItem('trky_list_viewMode'),
                      trky_list_sortBy: localStorage.getItem('trky_list_sortBy'),
                      exportedAt: new Date().toISOString(),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `trky-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Data exported successfully!');
                  }}
                >
                  <Download size={16} /> Export Data
                </motion.button>
                <motion.label
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload size={16} /> Import Data
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const data = JSON.parse(ev.target.result);
                          const keys = [
                            'trky_users', 'trky_tracking', 'trky_theme', 'trky_accent',
                            'trky_messages', 'trky_custom_chatrooms', 'trky_pinned',
                            'trky_collections', 'trky_reviews', 'trky_notifications',
                            'trky_recent_searches', 'trky_custom_media',
                            'trky_browse_viewMode', 'trky_browse_sortBy',
                            'trky_list_viewMode', 'trky_list_sortBy',
                          ];
                          keys.forEach(key => {
                            if (data[key]) localStorage.setItem(key, data[key]);
                          });
                          toast.success('Data imported! Reloading...');
                          setTimeout(() => window.location.reload(), 1500);
                        } catch {
                          toast.error('Invalid backup file.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </motion.label>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        <motion.button
          className="btn btn-primary btn-lg"
          onClick={handleSave}
          style={{ width: '100%' }}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save size={18} /> Save Changes
        </motion.button>
      </div>
    </PageTransition>
  );
}
