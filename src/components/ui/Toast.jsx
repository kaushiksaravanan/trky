import { useEffect } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info, Star } from 'lucide-react';

// Toast store
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, duration: 3000, ...toast }],
    }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience helpers
export const toast = {
  success: (message) => useToastStore.getState().addToast({ type: 'success', message }),
  error: (message) => useToastStore.getState().addToast({ type: 'error', message }),
  info: (message) => useToastStore.getState().addToast({ type: 'info', message }),
  warning: (message) => useToastStore.getState().addToast({ type: 'warning', message }),
  rating: (message) => useToastStore.getState().addToast({ type: 'rating', message }),
};

const ICONS = {
  success: <Check size={16} />,
  error: <X size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
  rating: <Star size={16} fill="currentColor" />,
};

const COLORS = {
  success: { bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', color: '#059669' },
  error: { bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.4)', color: '#dc2626' },
  warning: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', color: '#d97706' },
  info: { bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)', color: '#2563eb' },
  rating: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', color: '#d97706' },
};

function ToastItem({ toast: t, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onRemove]);

  const colors = COLORS[t.type] || COLORS.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(12px)',
        boxShadow: 'var(--shadow-lg)',
        fontSize: 13,
        fontWeight: 600,
        color: colors.color,
        cursor: 'pointer',
        maxWidth: 360,
        width: '100%',
      }}
      onClick={() => onRemove(t.id)}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{ICONS[t.type]}</span>
      <span style={{ flex: 1 }}>{t.message}</span>
      <span style={{ flexShrink: 0, display: 'flex', opacity: 0.5 }}>
        <X size={14} />
      </span>
    </motion.div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
