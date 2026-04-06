// Keyboard shortcuts hook
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
  { key: 'h', ctrl: true, shift: true, path: '/', label: 'Home' },
  { key: 'b', ctrl: true, shift: true, path: '/browse', label: 'Browse' },
  { key: 'k', ctrl: true, shift: true, path: '/search', label: 'Search' },
  { key: 'l', ctrl: true, shift: true, path: '/my-list', label: 'My List' },
  { key: 'm', ctrl: true, shift: true, path: '/chat', label: 'Chatrooms' },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      // Skip if in input/textarea/contenteditable
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.target.isContentEditable) return;

      for (const shortcut of SHORTCUTS) {
        if (
          e.key.toLowerCase() === shortcut.key &&
          ((shortcut.ctrl && (e.ctrlKey || e.metaKey)) || !shortcut.ctrl) &&
          ((shortcut.shift && e.shiftKey) || !shortcut.shift)
        ) {
          e.preventDefault();
          navigate(shortcut.path);
          return;
        }
      }

      // '/' to focus search when on search page
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);
}

export { SHORTCUTS };
