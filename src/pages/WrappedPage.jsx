import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORY_LABELS } from '../data/sampleData';
import PageTransition from '../components/ui/PageTransition';
import { Sparkles, TrendingUp, Star, Calendar, Award, Flame, Music, Tv, Gamepad2, BookOpen, Film, ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { toast } from '../components/ui/Toast';

// ---------- helpers ----------

const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

const categoryIcons = {
  anime: Tv,
  games: Gamepad2,
  music: Music,
  books: BookOpen,
  movies: Film,
  'tv-shows': Tv,
  cartoons: Film,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonth(monthStr) {
  if (!monthStr) return 'N/A';
  const parts = monthStr.split('-');
  const idx = parseInt(parts[1], 10) - 1;
  return MONTH_NAMES[idx] || monthStr;
}

// ---------- count-up hook ----------

function useCountUp(target, duration = 1600, active = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, active]);

  return value;
}

// ---------- sparkle particles ----------

function SparkleParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1.2, 0],
            y: [0, -30],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.4)',
          }}
        />
      ))}
    </div>
  );
}

// ---------- shared slide wrapper ----------

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.92 }),
};

function SlideWrapper({ children, gradient, index }) {
  return (
    <motion.div
      custom={1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: gradient || SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length],
        borderRadius: 24,
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------- individual slides ----------

function SlideWelcome({ data }) {
  return (
    <SlideWrapper index={0}>
      <SparkleParticles />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <Sparkles size={64} color="#fff" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6))' }} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: '#fff',
          margin: '24px 0 8px',
          lineHeight: 1.1,
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          letterSpacing: '-1px',
        }}
      >
        Your {data.year}<br />in Review
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: 500, maxWidth: 340 }}
      >
        Let's look back at your incredible year of media tracking
      </motion.p>
    </SlideWrapper>
  );
}

function SlideTotalTracked({ data }) {
  const count = useCountUp(data.totalTracked, 1800);
  return (
    <SlideWrapper index={1}>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
      >
        <TrendingUp size={56} color="#fff" style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.5))' }} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 20, marginBottom: 8 }}
      >
        This year you tracked
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 160 }}
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          textShadow: '0 4px 30px rgba(0,0,0,0.25)',
          letterSpacing: '-3px',
        }}
      >
        {count}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontSize: 22, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
      >
        titles
      </motion.p>
    </SlideWrapper>
  );
}

function SlideCompleted({ data }) {
  const count = useCountUp(data.totalCompleted, 1600);
  return (
    <SlideWrapper index={2}>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        style={{ fontSize: 72, lineHeight: 1 }}
      >
        🏆
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 16, marginBottom: 8 }}
      >
        And you completed
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 180 }}
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          textShadow: '0 4px 30px rgba(0,0,0,0.25)',
          letterSpacing: '-3px',
        }}
      >
        {count}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
      >
        of them. Amazing dedication!
      </motion.p>
    </SlideWrapper>
  );
}

function SlideTopGenre({ data }) {
  return (
    <SlideWrapper index={3}>
      <motion.div
        initial={{ scale: 0, rotate: 15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <Star size={56} color="#fff" style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.5))' }} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 20, marginBottom: 12 }}
      >
        Your top genre was
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 160 }}
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 4px 30px rgba(0,0,0,0.3)',
          lineHeight: 1.1,
          padding: '8px 24px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {data.topGenre || 'Various'}
      </motion.div>
      {data.topCategory && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 16 }}
        >
          mostly in {CATEGORY_LABELS[data.topCategory] || data.topCategory}
        </motion.p>
      )}
    </SlideWrapper>
  );
}

function SlideTopRated({ data }) {
  const topRated = data.topRated;
  if (!topRated) {
    return (
      <SlideWrapper index={4}>
        <Award size={56} color="#fff" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 22, color: '#fff', fontWeight: 600, marginTop: 20 }}
        >
          No ratings yet — rate your favorites!
        </motion.p>
      </SlideWrapper>
    );
  }

  return (
    <SlideWrapper index={4}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
        style={{
          width: 140,
          height: 200,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          border: '3px solid rgba(255,255,255,0.3)',
          marginBottom: 20,
        }}
      >
        <img
          src={topRated.cover}
          alt={topRated.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 8 }}
      >
        Your highest rated
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          margin: '0 0 12px',
          maxWidth: 340,
          lineHeight: 1.15,
        }}
      >
        {topRated.title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 50,
          padding: '8px 20px',
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        <Star size={20} color="#fbbf24" fill="#fbbf24" />
        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
          {topRated.rating}/10
        </span>
      </motion.div>
    </SlideWrapper>
  );
}

function SlideExplorer({ data }) {
  const genres = useCountUp(data.genresExplored, 1200);
  const cats = useCountUp(data.categoriesExplored, 1200);

  return (
    <SlideWrapper index={5}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}
      >
        🧭
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 16 }}
      >
        You explored
      </motion.p>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, type: 'spring' }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            padding: '24px 32px',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            minWidth: 120,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{genres}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 4 }}>genres</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 20,
            padding: '24px 32px',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            minWidth: 120,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{cats}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 4 }}>categories</div>
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 20 }}
      >
        A true media explorer!
      </motion.p>
    </SlideWrapper>
  );
}

function SlideStreak({ streakData }) {
  const longest = useCountUp(streakData.longest, 1400);
  return (
    <SlideWrapper index={6}>
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.15 }}
      >
        <Flame size={64} color="#fff" style={{ filter: 'drop-shadow(0 0 24px rgba(255,100,0,0.6))' }} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: 16, marginBottom: 8 }}
      >
        Your longest streak
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.65, type: 'spring', stiffness: 160 }}
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          textShadow: '0 4px 30px rgba(0,0,0,0.3)',
          letterSpacing: '-3px',
        }}
      >
        {longest}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontSize: 22, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
      >
        days in a row
      </motion.p>
      {streakData.current > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          style={{
            marginTop: 20,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 50,
            padding: '8px 20px',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 14,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
          }}
        >
          Current streak: {streakData.current} day{streakData.current !== 1 ? 's' : ''}
        </motion.div>
      )}
    </SlideWrapper>
  );
}

function SlideSummary({ data, streakData, milestones }) {
  const achievedMilestones = milestones.filter(m => m.achieved);

  const handleShareImage = () => {
    try {
      const canvas = document.createElement('canvas');
      const W = 800, H = 500;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(0.5, '#16213e'); grad.addColorStop(1, '#0f3460');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Title
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.font = '900 32px Inter, system-ui, sans-serif';
      ctx.fillText(`My ${data.year} in Review`, W / 2, 55);
      // Stats row
      const stats = [
        { n: data.totalTracked, l: 'Tracked' }, { n: data.totalCompleted, l: 'Completed' },
        { n: data.totalEpisodes, l: 'Episodes' }, { n: data.avgRating, l: 'Avg Rating' },
      ];
      stats.forEach((s, i) => {
        const x = 100 + i * 175;
        ctx.font = '800 42px Inter, system-ui, sans-serif'; ctx.fillStyle = '#ec4899';
        ctx.fillText(String(s.n), x, 140);
        ctx.font = '500 14px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(s.l, x, 165);
      });
      // Top rated
      if (data.topRated) {
        ctx.font = '600 16px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('Highest Rated', W / 2, 220);
        ctx.font = '800 22px Inter, system-ui, sans-serif'; ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${data.topRated.title} (${data.topRated.rating}/10)`, W / 2, 250);
      }
      // Top genre + category
      ctx.font = '600 16px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      if (data.topGenre) { ctx.fillText('Top Genre', W / 2 - 120, 310); ctx.fillStyle = '#a78bfa'; ctx.font = '800 20px Inter'; ctx.fillText(data.topGenre, W / 2 - 120, 340); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '600 16px Inter, system-ui, sans-serif';
      if (data.topCategory) { ctx.fillText('Top Category', W / 2 + 120, 310); ctx.fillStyle = '#34d399'; ctx.font = '800 20px Inter'; ctx.fillText(CATEGORY_LABELS[data.topCategory] || data.topCategory, W / 2 + 120, 340); }
      // Streak
      if (streakData.longest > 0) {
        ctx.fillStyle = '#f97316'; ctx.font = '800 20px Inter'; ctx.fillText(`${streakData.longest}-day streak`, W / 2, 400);
      }
      // Branding
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '500 12px Inter, system-ui, sans-serif';
      ctx.fillText('trky -- track everything you love', W / 2, 470);
      // Export
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `trky-wrapped-${data.year}.png`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Wrapped image saved!');
      }, 'image/png');
    } catch { toast.error('Could not generate image'); }
  };

  return (
    <SlideWrapper gradient="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" index={7}>
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <SparkleParticles />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 24,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          {data.year} Summary
        </motion.h2>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: 'Tracked', value: data.totalTracked, icon: TrendingUp, color: '#60a5fa' },
            { label: 'Completed', value: data.totalCompleted, icon: Award, color: '#34d399' },
            { label: 'Episodes', value: data.totalEpisodes, icon: Tv, color: '#a78bfa' },
            { label: 'Avg Rating', value: data.avgRating, icon: Star, color: '#fbbf24' },
            { label: 'Genres', value: data.genresExplored, icon: Sparkles, color: '#f093fb' },
            { label: 'Best Streak', value: `${streakData.longest}d`, icon: Flame, color: '#f97316' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 200 }}
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: '16px 12px',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
              }}
            >
              <stat.icon size={18} color={stat.color} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Top rated highlight */}
        {data.topRated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(10px)',
              borderRadius: 14,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 16,
            }}
          >
            <div style={{
              width: 48,
              height: 64,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.1)',
            }}>
              <img
                src={data.topRated.cover}
                alt={data.topRated.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Favorite</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{data.topRated.title}</div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(251,191,36,0.2)', borderRadius: 8, padding: '4px 10px',
            }}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24' }}>{data.topRated.rating}</span>
            </div>
          </motion.div>
        )}

        {/* Busiest month */}
        {data.busiestMonth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
              fontSize: 14,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            <Calendar size={14} />
            Busiest month: <strong style={{ color: '#fff' }}>{formatMonth(data.busiestMonth)}</strong>
          </motion.div>
        )}

        {/* Milestones */}
        {achievedMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 10,
            }}>
              Milestones Earned
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {achievedMilestones.slice(0, 8).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.07, type: 'spring', stiffness: 300 }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '6px 12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{m.icon}</span>
                  {m.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        onClick={handleShareImage}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <Download size={16} /> Save as Image
      </motion.button>
    </SlideWrapper>
  );
}

// ---------- main page ----------

const TOTAL_SLIDES = 8;

export default function WrappedPage() {
  const { currentUser } = useAuthStore();
  const { getWrappedData, getStreakData, getMilestones } = useTrackingStore();

  const userId = currentUser?.id;
  const data = userId ? getWrappedData(userId) : null;
  const streakData = userId ? getStreakData(userId) : { current: 0, longest: 0, totalDays: 0 };
  const milestones = userId ? getMilestones(userId) : [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const hasData = data && data.totalTracked > 0;

  const TOTAL_SLIDES_COUNT = TOTAL_SLIDES;

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide(s => s < TOTAL_SLIDES_COUNT - 1 ? s + 1 : s);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide(s => s > 0 ? s - 1 : s);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Empty state
  if (!hasData) {
    return (
      <PageTransition>
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 32,
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          >
            <Sparkles size={64} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}
          >
            Your Year in Review
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.6 }}
          >
            Start tracking to unlock your Year in Review! Add media to your list, rate your favorites, and come back to see your personalized story.
          </motion.p>
        </div>
      </PageTransition>
    );
  }

  const slides = [
    <SlideWelcome key="welcome" data={data} />,
    <SlideTotalTracked key="tracked" data={data} />,
    <SlideCompleted key="completed" data={data} />,
    <SlideTopGenre key="genre" data={data} />,
    <SlideTopRated key="toprated" data={data} />,
    <SlideExplorer key="explorer" data={data} />,
    <SlideStreak key="streak" streakData={streakData} />,
    <SlideSummary key="summary" data={data} streakData={streakData} milestones={milestones} />,
  ];

  return (
    <PageTransition>
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}>
        {/* Slide container */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          height: 560,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
          <AnimatePresence mode="wait" custom={direction}>
            {slides[currentSlide]}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 24,
          alignItems: 'center',
        }}>
          {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              animate={{
                width: i === currentSlide ? 28 : 8,
                background: i === currentSlide
                  ? 'var(--accent, #8b5cf6)'
                  : 'var(--text-muted, #666)',
                opacity: i === currentSlide ? 1 : 0.4,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                height: 8,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              whileHover={{ opacity: 0.8, scale: 1.2 }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 20,
          alignItems: 'center',
        }}>
          <motion.button
            onClick={goPrev}
            disabled={currentSlide === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 14,
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              background: 'var(--bg-card, #1a1a2e)',
              color: currentSlide === 0 ? 'var(--text-muted, #666)' : 'var(--text-primary, #fff)',
              fontSize: 15,
              fontWeight: 600,
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === 0 ? 0.5 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <motion.button
            onClick={goNext}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 14,
              border: 'none',
              background: currentSlide === TOTAL_SLIDES - 1
                ? 'var(--text-muted, #666)'
                : 'var(--accent, #8b5cf6)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: currentSlide === TOTAL_SLIDES - 1 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === TOTAL_SLIDES - 1 ? 0.5 : 1,
              boxShadow: currentSlide === TOTAL_SLIDES - 1 ? 'none' : '0 4px 20px rgba(139,92,246,0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {currentSlide === TOTAL_SLIDES - 1 ? 'Done' : 'Next'}
            {currentSlide < TOTAL_SLIDES - 1 && <ArrowRight size={18} />}
          </motion.button>
        </div>

        {/* Slide counter */}
        <div style={{
          marginTop: 12,
          fontSize: 13,
          color: 'var(--text-muted, #666)',
          fontWeight: 500,
        }}>
          {currentSlide + 1} / {TOTAL_SLIDES}
        </div>
      </div>
    </PageTransition>
  );
}
