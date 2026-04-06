import { useState } from 'react';

export default function SpoilerBlock({ children }) {
  const [revealed, setRevealed] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRevealed(!revealed);
    }
  };

  return (
    <div
      className={`spoiler-blur ${revealed ? 'revealed' : ''}`}
      onClick={() => setRevealed(!revealed)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={revealed ? 'Hide spoiler' : 'Reveal spoiler'}
      aria-expanded={revealed}
    >
      <div className="spoiler-content">
        {children}
      </div>
    </div>
  );
}
