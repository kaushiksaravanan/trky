// Theme store - persists to localStorage, supports accent colors
import { create } from 'zustand';

const ACCENT_PRESETS = {
  pink: { accent: '#ec4899', accentHover: '#db2777', accentSoft: 'rgba(236, 72, 153, 0.1)', textAccent: '#db2777', darkTextAccent: '#f472b6', darkAccentSoft: 'rgba(236, 72, 153, 0.15)' },
  rose: { accent: '#f43f5e', accentHover: '#e11d48', accentSoft: 'rgba(244, 63, 94, 0.1)', textAccent: '#e11d48', darkTextAccent: '#fb7185', darkAccentSoft: 'rgba(244, 63, 94, 0.15)' },
  purple: { accent: '#a855f7', accentHover: '#9333ea', accentSoft: 'rgba(168, 85, 247, 0.1)', textAccent: '#9333ea', darkTextAccent: '#c084fc', darkAccentSoft: 'rgba(168, 85, 247, 0.15)' },
  violet: { accent: '#8b5cf6', accentHover: '#7c3aed', accentSoft: 'rgba(139, 92, 246, 0.1)', textAccent: '#7c3aed', darkTextAccent: '#a78bfa', darkAccentSoft: 'rgba(139, 92, 246, 0.15)' },
  blue: { accent: '#3b82f6', accentHover: '#2563eb', accentSoft: 'rgba(59, 130, 246, 0.1)', textAccent: '#2563eb', darkTextAccent: '#60a5fa', darkAccentSoft: 'rgba(59, 130, 246, 0.15)' },
  teal: { accent: '#14b8a6', accentHover: '#0d9488', accentSoft: 'rgba(20, 184, 166, 0.1)', textAccent: '#0d9488', darkTextAccent: '#2dd4bf', darkAccentSoft: 'rgba(20, 184, 166, 0.15)' },
  orange: { accent: '#f97316', accentHover: '#ea580c', accentSoft: 'rgba(249, 115, 22, 0.1)', textAccent: '#ea580c', darkTextAccent: '#fb923c', darkAccentSoft: 'rgba(249, 115, 22, 0.15)' },
  red: { accent: '#ef4444', accentHover: '#dc2626', accentSoft: 'rgba(239, 68, 68, 0.1)', textAccent: '#dc2626', darkTextAccent: '#f87171', darkAccentSoft: 'rgba(239, 68, 68, 0.15)' },
};

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('trky_theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  // Auto-detect OS preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const getInitialAccent = () => {
  try {
    const stored = localStorage.getItem('trky_accent');
    if (stored && ACCENT_PRESETS[stored]) return stored;
  } catch {}
  return 'pink';
};

// Apply theme to document on load
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('trky_theme', theme);
};

const applyAccent = (accentName, currentTheme) => {
  const preset = ACCENT_PRESETS[accentName];
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--accent-hover', preset.accentHover);
  root.style.setProperty('--accent-soft', currentTheme === 'dark' ? preset.darkAccentSoft : preset.accentSoft);
  root.style.setProperty('--text-accent', currentTheme === 'dark' ? preset.darkTextAccent : preset.textAccent);
  localStorage.setItem('trky_accent', accentName);
};

// Apply immediately on load
const initialTheme = getInitialTheme();
const initialAccent = getInitialAccent();
applyTheme(initialTheme);
applyAccent(initialAccent, initialTheme);

export { ACCENT_PRESETS };

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,
  accent: initialAccent,

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    applyAccent(get().accent, next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    applyAccent(get().accent, theme);
    set({ theme });
  },

  setAccent: (accentName) => {
    applyAccent(accentName, get().theme);
    set({ accent: accentName });
  },
}));
