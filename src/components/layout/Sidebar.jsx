import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { CATEGORIES, CATEGORY_LABELS } from '../../data/sampleData';
import NotificationBell from '../ui/NotificationBell';
import {
  Home, Compass, List, MessageCircle, User, Settings, LogOut,
  Search, Gamepad2, Tv, Music, BookOpen, Smile, Film, Monitor,
  Menu, X, ChevronRight, Moon, Sun, BarChart3, FolderOpen, Sparkles,
} from 'lucide-react';

const categoryIcons = {
  anime: Tv,
  games: Gamepad2,
  music: Music,
  books: BookOpen,
  cartoons: Smile,
  movies: Film,
  'tv-shows': Monitor,
};

function SidebarContent({ currentUser, isDark, toggleTheme, closeMobile, handleLogout }) {
  return (
    <>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavLink to="/" className="sidebar-logo" onClick={closeMobile}>
            <div className="sidebar-logo-icon">T</div>
            <span className="sidebar-logo-text">trky</span>
          </NavLink>
          <NotificationBell />
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Main</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Home size={18} /> Home
        </NavLink>
        <NavLink to="/browse" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Compass size={18} /> Browse
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Search size={18} /> Search
        </NavLink>
        <NavLink to="/my-list" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <List size={18} /> My List
        </NavLink>
        <NavLink to="/collections" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <FolderOpen size={18} /> Collections
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <BarChart3 size={18} /> Stats
        </NavLink>
        <NavLink to="/wrapped" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Sparkles size={18} /> Year in Review
          <span className="sidebar-badge" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', fontSize: 10 }}>NEW</span>
        </NavLink>

        <div className="sidebar-section-title">Categories</div>
        {CATEGORIES.map(cat => {
          const Icon = categoryIcons[cat];
          return (
            <NavLink key={cat} to={`/browse/${cat}`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
              <Icon size={18} /> {CATEGORY_LABELS[cat]}
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          );
        })}

        <div className="sidebar-section-title">Social</div>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <MessageCircle size={18} /> Chatrooms
          <span className="sidebar-badge pulse-badge">Live</span>
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Search size={18} /> Discover People
        </NavLink>
        <NavLink to={`/profile/${currentUser?.username}`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <User size={18} /> My Profile
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
          <Settings size={18} /> Settings
        </NavLink>

        {/* Theme toggle */}
        <div style={{ padding: '8px 0' }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span style={{ flex: 1 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            <div className={`theme-toggle-track ${isDark ? 'active' : ''}`}>
              <div className="theme-toggle-thumb" />
            </div>
          </button>
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          <img src={currentUser?.avatar} alt={currentUser?.username} />
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{currentUser?.displayName}</div>
          <div className="sidebar-user-status">Online</div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { currentUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarProps = { currentUser, isDark, toggleTheme, closeMobile, handleLogout };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar sidebar-desktop">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
            />
            <motion.aside
              className="sidebar sidebar-mobile"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button className="mobile-close-btn" onClick={closeMobile}>
                <X size={20} />
              </button>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
