import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { X, Sparkles } from 'lucide-react';

export default function LoginPrompt() {
  const { currentUser, dismissLoginPrompt } = useAuthStore();
  const { getNewReleases, getUserTrackedMedia, trackMedia } = useTrackingStore();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const newReleases = getNewReleases().slice(0, 3);
    const tracked = getUserTrackedMedia(currentUser?.id);
    const inProgress = tracked.filter(m => m.tracking?.status === 'in-progress');

    const qs = [];

    // Ask about in-progress items
    inProgress.slice(0, 2).forEach(item => {
      if (item.latestEpisode) {
        qs.push({
          id: `ep-${item.id}`,
          text: `Did you catch the latest episode of ${item.title}? (Ep ${item.latestEpisode.number}: "${item.latestEpisode.title}")`,
          mediaId: item.id,
          type: 'episode',
        });
      }
    });

    // Ask about new releases
    newReleases.forEach(item => {
      if (!tracked.find(t => t.id === item.id)) {
        qs.push({
          id: `new-${item.id}`,
          text: `${item.title} just dropped! Have you checked it out?`,
          mediaId: item.id,
          type: 'new-release',
        });
      }
    });

    // General question
    qs.push({
      id: 'general',
      text: 'Watched or played anything new lately?',
      type: 'general',
    });

    setQuestions(qs.slice(0, 4));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleAnswer = (qId, answer) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));

    // If they say yes to a new release, auto-track it
    const q = questions.find(q => q.id === qId);
    if (answer === 'yes' && q?.type === 'new-release' && q.mediaId && currentUser) {
      trackMedia(currentUser.id, q.mediaId, { status: 'in-progress' });
    }
    if (answer === 'yes' && q?.type === 'episode' && q.mediaId && currentUser) {
      const tracked = getUserTrackedMedia(currentUser.id);
      const item = tracked.find(t => t.id === q.mediaId);
      if (item?.latestEpisode?.number) {
        const currentProgress = item.tracking?.progress || 0;
        trackMedia(currentUser.id, q.mediaId, { progress: Math.max(currentProgress, item.latestEpisode.number) });
      }
    }
  };

  const handleDismiss = () => {
    dismissLoginPrompt();
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;

  return (
    <motion.div
      className="login-prompt-overlay"
      onClick={(e) => e.target === e.currentTarget && handleDismiss()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="login-prompt-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <div className="login-prompt-title">
              <motion.span
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 15, -10, 5, 0] }}
                transition={{ duration: 1.2, delay: 0.3 }}
                style={{ display: 'inline-block' }}
              >
                <Sparkles size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--accent)' }} />
              </motion.span>
              Welcome back, {currentUser?.displayName}!
            </div>
            <div className="login-prompt-text">Let's catch up on what you've been into.</div>
          </div>
          <motion.button
            className="modal-close"
            onClick={handleDismiss}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        <AnimatePresence>
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              className="login-prompt-question"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: i <= Object.keys(answers).length ? 1 : 0.4, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <p>{q.text}</p>
              <div className="login-prompt-answers">
                <motion.button
                  className={`login-prompt-answer ${answers[q.id] === 'yes' ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, 'yes')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {q.type === 'general' ? 'Yes, show me!' : 'Yes!'}
                </motion.button>
                <motion.button
                  className={`login-prompt-answer ${answers[q.id] === 'no' ? 'selected' : ''}`}
                  onClick={() => handleAnswer(q.id, 'no')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Not yet
                </motion.button>
                {q.type !== 'general' && (
                  <motion.button
                    className={`login-prompt-answer ${answers[q.id] === 'later' ? 'selected' : ''}`}
                    onClick={() => handleAnswer(q.id, 'later')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Remind me later
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <motion.button
            className="btn btn-ghost"
            onClick={handleDismiss}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Skip
          </motion.button>
          <motion.button
            className="btn btn-primary"
            onClick={handleDismiss}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            {allAnswered ? "Done, let's go!" : 'Continue to trky'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
