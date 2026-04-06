// Utility helpers
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timestamp) => {
  if (timestamp == null) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const timeAgo = (timestamp) => {
  const ms = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(ms)) return '';
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(ms);
};

export const truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

export const generateGradient = (seed) => {
  if (!seed || seed.length === 0) return 'linear-gradient(135deg, #c084fc, #818cf8)';
  const colors = ['#ff6b9d', '#ff85ab', '#ffa0bc', '#ffb8cc', '#c084fc', '#a78bfa', '#818cf8'];
  const i = seed.charCodeAt(0) % colors.length;
  const j = (seed.charCodeAt(1) || 0) % colors.length;
  return `linear-gradient(135deg, ${colors[i]}, ${colors[j]})`;
};

export const getInitials = (name) => {
  if (!name) return '';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0, 2);
};

export const clamp = (val, min, max) => {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};
