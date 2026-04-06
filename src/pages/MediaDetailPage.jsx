import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useReviewStore } from '../stores/reviewStore';
import { STATUS_OPTIONS, STATUS_LABELS, STATUS_COLORS, PLATFORM_LINKS, CATEGORY_LABELS } from '../data/sampleData';
import RatingStars from '../components/ui/RatingStars';
import SpoilerBlock from '../components/ui/SpoilerBlock';
import PageTransition from '../components/ui/PageTransition';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, ExternalLink, Clock, Calendar, Tag, Bookmark, Trash2, Star, Share2, Check, FolderPlus, FolderOpen, ChevronDown, MessageSquare, ThumbsUp, AlertTriangle, Send, Edit3, Sparkles, Heart } from 'lucide-react';
import MediaCard from '../components/tracking/MediaCard';
import { timeAgo } from '../utils/helpers';

export default function MediaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, toggleFavorite, getFavorites } = useAuthStore();
  const { getMediaById, getTrackedItem, trackMedia, rateMedia, removeTracking, getSimilarMedia } = useTrackingStore();
  const { getUserCollections, addToCollection, getCollectionsForMedia, removeFromCollection } = useCollectionStore();

  const media = getMediaById(id);
  const tracked = currentUser ? getTrackedItem(currentUser.id, id) : null;
  const [notes, setNotes] = useState(tracked?.notes || '');
  const [collectionDropdownOpen, setCollectionDropdownOpen] = useState(false);

  const userCollections = currentUser ? getUserCollections(currentUser.id) : [];
  const mediaInCollections = currentUser ? getCollectionsForMedia(currentUser.id, id) : [];

  // Reviews
  const { getReviewsForMedia, getUserReview, addReview, deleteReview, toggleLike, getAverageRating } = useReviewStore();
  const reviews = getReviewsForMedia(id);
  const myReview = currentUser ? getUserReview(id, currentUser.id) : null;
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewTitle, setReviewTitle] = useState(myReview?.title || '');
  const [reviewBody, setReviewBody] = useState(myReview?.body || '');
  const [reviewRating, setReviewRating] = useState(myReview?.rating || 0);
  const [reviewSpoiler, setReviewSpoiler] = useState(myReview?.spoiler || false);
  const [reviewSort, setReviewSort] = useState('newest');
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset form state when navigating between media items
  useEffect(() => {
    const currentTracked = currentUser ? getTrackedItem(currentUser.id, id) : null;
    const currentReview = currentUser ? getUserReview(id, currentUser.id) : null;
    setNotes(currentTracked?.notes || '');
    setReviewTitle(currentReview?.title || '');
    setReviewBody(currentReview?.body || '');
    setReviewRating(currentReview?.rating || 0);
    setReviewSpoiler(currentReview?.spoiler || false);
    setShowReviewForm(false);
    setCollectionDropdownOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!media) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-icon">404</div>
          <div className="empty-state-title">Media not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/browse')}>Browse All</button>
        </div>
      </div>
    );
  }

  const handleTrack = (status) => {
    trackMedia(currentUser.id, media.id, { status, notes });
    toast.success(`${media.title} marked as ${STATUS_LABELS[status]}`);
    if (status === 'completed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  };

  const handleRate = (rating) => {
    rateMedia(currentUser.id, media.id, rating);
    if (rating > 0) toast.rating(`Rated ${media.title} ${rating}/10`);
  };

  const handleRemove = () => {
    removeTracking(currentUser.id, media.id);
    toast.info(`${media.title} removed from your list`);
  };

  const notesTimerRef = useRef(null);
  const handleNotesChange = useCallback((e) => {
    const value = e.target.value;
    setNotes(value);
    // Only auto-save notes if the media is already being tracked
    if (!tracked) return;
    // Debounce localStorage writes to avoid excessive saves on every keystroke
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      trackMedia(currentUser.id, media.id, { notes: value });
    }, 500);
  }, [trackMedia, currentUser?.id, media?.id, tracked]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/media/${media.id}`)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleToggleCollection = (collectionId, collectionName) => {
    const isIn = mediaInCollections.some(c => c.id === collectionId);
    if (isIn) {
      removeFromCollection(currentUser.id, collectionId, media.id);
      toast.info(`Removed from "${collectionName}"`);
    } else {
      const added = addToCollection(currentUser.id, collectionId, media.id);
      if (added) toast.success(`Added to "${collectionName}"`);
    }
  };

  const handleSubmitReview = () => {
    if (!reviewBody.trim()) {
      toast.error('Please write something in your review');
      return;
    }
    addReview(media.id, currentUser, {
      rating: reviewRating,
      title: reviewTitle.trim(),
      body: reviewBody.trim(),
      spoiler: reviewSpoiler,
    });
    toast.success(myReview ? 'Review updated!' : 'Review posted!');
    setShowReviewForm(false);
  };

  const handleDeleteReview = (reviewId) => {
    deleteReview(media.id, reviewId);
    toast.info('Review deleted');
    setReviewTitle('');
    setReviewBody('');
    setReviewRating(0);
    setReviewSpoiler(false);
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (reviewSort) {
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'most-liked': return b.likes - a.likes;
      case 'highest-rated': return b.rating - a.rating;
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const platformUrl = PLATFORM_LINKS[media.platform];

  return (
    <PageTransition>
      {/* Confetti celebration on completion */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1, scale: 0 }}
                animate={{
                  y: '110vh',
                  rotate: Math.random() * 720 - 360,
                  scale: [0, 1, 1, 0.5],
                  opacity: [1, 1, 1, 0],
                }}
                transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 8 + Math.random() * 8,
                  height: 8 + Math.random() * 8,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  background: ['#ec4899','#8b5cf6','#fbbf24','#34d399','#60a5fa','#f43f5e'][i % 6],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn btn-ghost" onClick={handleShare}>
            <Share2 size={16} /> Share
          </button>
          {currentUser && (
            <motion.button
              className="btn btn-ghost"
              onClick={() => toggleFavorite(media.id)}
              whileTap={{ scale: 0.85 }}
              style={{ color: (getFavorites(currentUser.id) || []).includes(media.id) ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Heart size={16} fill={(getFavorites(currentUser.id) || []).includes(media.id) ? 'var(--accent)' : 'none'} /> Favorite
            </motion.button>
          )}
        </div>

        <div className="media-detail">
          {/* Hero */}
          <motion.div
            className="media-detail-hero"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <img
              className="media-detail-backdrop"
              src={media.thumbnail}
              alt={media.title}
              onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, var(--pink-200), var(--violet-400))'; }}
            />
            <div className="media-detail-overlay">
              <div className="media-detail-title">{media.title}</div>
              <div className="media-detail-subtitle">{media.subtitle}</div>
            </div>
          </motion.div>

          <div className="media-detail-grid">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Plot - spoiler protected */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Plot</h3>
                <SpoilerBlock>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{media.plot}</p>
                </SpoilerBlock>
              </div>

              {/* Thumbnail - spoiler protected */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Preview</h3>
                <SpoilerBlock>
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 300, objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </SpoilerBlock>
              </div>

              {/* Latest episode */}
              {media.latestEpisode && (
                <motion.div
                  className="card"
                  style={{ marginBottom: 16 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Latest Episode</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--pink-400), var(--violet-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                      {media.latestEpisode.number}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{media.latestEpisode.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> Aired {media.latestEpisode.aired}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Personal Notes</h3>
                <textarea
                  className="input"
                  placeholder="Add your personal notes here..."
                  value={notes}
                  onChange={handleNotesChange}
                  rows={4}
                />
              </div>
            </motion.div>

            {/* Right column - tracking controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              {/* Info card */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={16} fill="var(--yellow-400)" color="var(--yellow-400)" />
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{media.rating > 0 ? media.rating.toFixed(1) : 'N/A'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Community Rating</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {media.genres?.map(g => <span key={g} className="genre-tag">{g}</span>)}
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span><Calendar size={13} style={{ verticalAlign: 'middle' }} /> {media.year}</span>
                    {media.episodes && <span><Clock size={13} style={{ verticalAlign: 'middle' }} /> {media.episodes} eps</span>}
                    <span><Tag size={13} style={{ verticalAlign: 'middle' }} /> {CATEGORY_LABELS[media.category]}</span>
                    {(() => {
                      const durations = { anime: 24, 'tv-shows': 45, movies: 120, cartoons: 22, books: 0, music: 0, games: 0 };
                      const minsPerEp = media.avgDuration || durations[media.category] || 0;
                      if (minsPerEp <= 0 || !media.episodes) return null;
                      const totalMins = media.episodes * minsPerEp;
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const remaining = tracked ? ((media.episodes - (tracked.progress || 0)) * minsPerEp) : totalMins;
                      const rh = Math.floor(remaining / 60);
                      const rm = remaining % 60;
                      return (
                        <span style={{ color: 'var(--text-accent)' }} title={`${h}h ${m}m total`}>
                          <Clock size={13} style={{ verticalAlign: 'middle' }} />
                          {tracked && tracked.progress > 0 ? ` ~${rh}h ${rm}m left` : ` ~${h}h ${m}m total`}
                        </span>
                      );
                    })()}
                  </div>

                  {platformUrl && (
                    <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="platform-link">
                      <ExternalLink size={12} /> Watch on {media.platform}
                    </a>
                  )}
                </div>
              </div>

              {/* Your rating */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Your Rating</h3>
                <RatingStars
                  rating={tracked?.rating || 0}
                  onRate={handleRate}
                  size={24}
                />
              </div>

              {/* Tracking status */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Tracking Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {STATUS_OPTIONS.map(status => (
                    <motion.button
                      key={status}
                      className={`btn btn-sm ${tracked?.status === status ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleTrack(status)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        justifyContent: 'flex-start',
                        borderLeft: `3px solid ${STATUS_COLORS[status]}`,
                      }}
                    >
                      <Bookmark size={14} />
                      {STATUS_LABELS[status]}
                      {tracked?.status === status && (
                        <Check size={14} style={{ marginLeft: 'auto', color: 'white' }} />
                      )}
                    </motion.button>
                  ))}
                </div>

                {tracked && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemove}
                    style={{ marginTop: 12, color: 'var(--red-400)', width: '100%' }}
                  >
                    <Trash2 size={14} /> Remove from list
                  </button>
                )}
              </div>

              {/* Progress */}
              {tracked && media.episodes && (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Progress</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      type="number"
                      className="input"
                      value={tracked.progress || 0}
                      min={0}
                      max={media.episodes}
                      onChange={(e) => trackMedia(currentUser.id, media.id, { progress: parseInt(e.target.value) || 0 })}
                      style={{ width: 70, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {media.episodes} episodes</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((tracked.progress || 0) / media.episodes) * 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Add to Collection */}
              <div className="card" style={{ position: 'relative' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderOpen size={16} /> Collections
                </h3>

                {/* Collections this media is in */}
                {mediaInCollections.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {mediaInCollections.map(col => (
                      <motion.span
                        key={col.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 'var(--radius-full)',
                          background: col.color + '22', border: `1px solid ${col.color}44`,
                          fontSize: 12, fontWeight: 600, color: col.color, cursor: 'pointer',
                        }}
                        title={`Click to remove from "${col.name}"`}
                        onClick={() => handleToggleCollection(col.id, col.name)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {col.icon !== 'list' ? col.icon : '📁'} {col.name} ✕
                      </motion.span>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCollectionDropdownOpen(!collectionDropdownOpen)}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FolderPlus size={14} /> Add to Collection
                  </span>
                  <ChevronDown size={14} style={{ transform: collectionDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                <AnimatePresence>
                  {collectionDropdownOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {userCollections.length === 0 ? (
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                            No collections yet. Create one on the <a href="/collections" style={{ color: 'var(--accent)' }}>Collections page</a>.
                          </div>
                        ) : (
                          userCollections.map(col => {
                            const isIn = mediaInCollections.some(c => c.id === col.id);
                            return (
                              <motion.button
                                key={col.id}
                                className={`btn btn-sm ${isIn ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => handleToggleCollection(col.id, col.name)}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.97 }}
                                style={{ justifyContent: 'flex-start', borderLeft: `3px solid ${col.color}` }}
                              >
                                <span>{col.icon !== 'list' ? col.icon : '📁'}</span>
                                <span style={{ flex: 1, textAlign: 'left' }}>{col.name}</span>
                                {isIn && <Check size={14} />}
                              </motion.button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={20} /> Reviews
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>({reviews.length})</span>
                {(() => {
                  const avg = getAverageRating(id);
                  if (avg <= 0) return null;
                  return (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--yellow-400)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 8 }}>
                      <Star size={13} fill="currentColor" /> {avg.toFixed(1)} avg
                    </span>
                  );
                })()}
              </h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  className="input"
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most-liked">Most Liked</option>
                  <option value="highest-rated">Highest Rated</option>
                </select>
                {!showReviewForm && (
                  <motion.button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowReviewForm(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit3 size={14} /> {myReview ? 'Edit Review' : 'Write Review'}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  className="card"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                      {myReview ? 'Edit Your Review' : 'Write a Review'}
                    </h3>

                    {/* Rating row */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Your Score</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <motion.button
                            key={n}
                            onClick={() => setReviewRating(reviewRating === n ? 0 : n)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              width: 32, height: 32, borderRadius: 'var(--radius-md)',
                              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                              background: n <= reviewRating ? 'var(--accent)' : 'var(--bg-tertiary)',
                              color: n <= reviewRating ? 'white' : 'var(--text-secondary)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {n}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <input
                      className="input"
                      placeholder="Review title (optional)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      style={{ marginBottom: 10 }}
                    />

                    <textarea
                      className="input"
                      placeholder="Share your thoughts about this title..."
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      rows={4}
                      style={{ marginBottom: 10 }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={reviewSpoiler}
                          onChange={(e) => setReviewSpoiler(e.target.checked)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <AlertTriangle size={14} /> Contains spoilers
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
                        <motion.button
                          className="btn btn-primary btn-sm"
                          onClick={handleSubmitReview}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Send size={14} /> {myReview ? 'Update' : 'Post'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            {sortedReviews.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <MessageSquare size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No reviews yet. Be the first to share your thoughts!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sortedReviews.map((review, idx) => {
                  const isOwn = currentUser && review.userId === currentUser.id;
                  const hasLiked = currentUser && review.likedBy?.includes(currentUser.id);
                  return (
                    <motion.div
                      key={review.id}
                      className="card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {/* Review header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <img
                          src={review.avatar}
                          alt={review.username}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-tertiary)' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{review.displayName || review.username}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {timeAgo(review.createdAt)}
                            {review.updatedAt && ' (edited)'}
                          </div>
                        </div>
                        {review.rating > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 'var(--radius-full)',
                            background: review.rating >= 8 ? '#22c55e22' : review.rating >= 5 ? '#eab30822' : '#ef444422',
                            color: review.rating >= 8 ? '#22c55e' : review.rating >= 5 ? '#eab308' : '#ef4444',
                            fontWeight: 800, fontSize: 14,
                          }}>
                            <Star size={14} fill="currentColor" /> {review.rating}
                          </div>
                        )}
                      </div>

                      {/* Review title */}
                      {review.title && (
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{review.title}</div>
                      )}

                      {/* Review body */}
                      {review.spoiler ? (
                        <SpoilerBlock>
                          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{review.body}</p>
                        </SpoilerBlock>
                      ) : (
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 10 }}>{review.body}</p>
                      )}

                      {/* Review actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                        <motion.button
                          className="btn btn-ghost btn-sm"
                          onClick={() => currentUser && toggleLike(media.id, review.id, currentUser.id)}
                          whileTap={{ scale: 0.9 }}
                          style={{ color: hasLiked ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13 }}
                        >
                          <ThumbsUp size={14} fill={hasLiked ? 'currentColor' : 'none'} /> {review.likes || 0}
                        </motion.button>
                        {review.spoiler && (
                          <span style={{ fontSize: 12, color: 'var(--yellow-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} /> Spoiler
                          </span>
                        )}
                        <div style={{ flex: 1 }} />
                        {isOwn && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setReviewTitle(review.title);
                                setReviewBody(review.body);
                                setReviewRating(review.rating);
                                setReviewSpoiler(review.spoiler);
                                setShowReviewForm(true);
                              }}
                              style={{ fontSize: 13 }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteReview(review.id)}
                              style={{ fontSize: 13, color: 'var(--red-400)' }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Similar Media - "If You Liked This" */}
          {(() => {
            const similar = getSimilarMedia(media.id, 6);
            if (similar.length === 0) return null;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="section-header" style={{ marginTop: 32 }}>
                  <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} style={{ color: 'var(--accent)' }} /> If You Liked This
                  </div>
                </div>
                <div className="horizontal-scroll">
                  {similar.map(item => (
                    <MediaCard key={item.id} media={item} compact />
                  ))}
                </div>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </PageTransition>
  );
}
