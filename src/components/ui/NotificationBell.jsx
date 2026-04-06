import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, Users, TrendingUp, Check, Trash2 } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { timeAgo } from '../../utils/helpers';

const typeIcons = {
  release: Sparkles,
  social: Users,
  update: TrendingUp,
};

export default function NotificationBell() {
  const { notifications, isOpen, togglePanel, closePanel, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = useNotificationStore(s => s.notifications.filter(n => !n.read).length);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        closePanel();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, closePanel]);

  return (
    <div className="notification-bell" ref={ref}>
      <motion.button
        className="btn btn-ghost btn-icon"
        onClick={togglePanel}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            className="notification-dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="notification-header">
              <span className="notification-header-title">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              {unreadCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={markAllAsRead}
                  style={{ fontSize: 11 }}
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={clearAll}
                  style={{ fontSize: 11, color: 'var(--text-muted)' }}
                  title="Clear all notifications"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="notification-empty">
                No notifications yet
              </div>
            ) : (
              notifications.map((n, i) => {
                const Icon = typeIcons[n.type] || Sparkles;
                return (
                  <motion.div
                    key={n.id}
                    className="notification-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => markAsRead(n.id)}
                    style={{ opacity: n.read ? 0.6 : 1 }}
                  >
                    <div className="notification-item-icon">
                      <Icon size={16} />
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title">{n.title}</div>
                      <div className="notification-item-text">{n.text}</div>
                    </div>
                    <span className="notification-item-time">{timeAgo(n.time)}</span>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
