import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTrackingStore } from '../stores/trackingStore';
import { CATEGORIES, CATEGORY_LABELS, sampleMedia } from '../data/sampleData';
import PageTransition from '../components/ui/PageTransition';
import { AlertTriangle, Eye, EyeOff, ArrowRight, ArrowLeft, UserPlus, Star } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', displayName: '', bio: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [quickPicks, setQuickPicks] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { register, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (form.password !== form.confirmPassword) {
      useAuthStore.setState({ error: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    const success = await register(form.username, form.password, form.displayName, form.bio, selectedCategories);
    setLoading(false);
    if (success) {
      // Bulk-track quick picks as "planning"
      const { trackMedia } = useTrackingStore.getState();
      const userId = useAuthStore.getState().currentUser?.id;
      if (userId && quickPicks.length > 0) {
        quickPicks.forEach(mediaId => {
          trackMedia(userId, mediaId, { status: 'planning' });
        });
      }
      navigate('/');
    }
  };

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div
          className="auth-card"
          style={{ maxWidth: 480 }}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="auth-logo">
            <motion.div
              className="auth-logo-icon"
              initial={{ rotate: 10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              T
            </motion.div>
            <div className="auth-title">Join trky</div>
            <div className="auth-subtitle">Track everything you love</div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
              <span>1</span> Account
            </div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
              <span>2</span> Preferences
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-warning">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>There is NO password recovery. If you forget your password, your account is permanently lost. Keep it safe!</span>
            </div>

            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div className="input-group">
                    <label className="input-label">Username (unique, 3-20 chars)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Choose a unique username"
                      value={form.username}
                      onChange={(e) => updateForm('username', e.target.value)}
                      required
                      autoFocus
                      pattern="[a-zA-Z0-9_]+"
                      minLength={3}
                      maxLength={20}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Display Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="What should we call you?"
                      value={form.displayName}
                      onChange={(e) => updateForm('displayName', e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Password (min 6 chars)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Choose a strong password"
                        value={form.password}
                        onChange={(e) => updateForm('password', e.target.value)}
                        required
                        minLength={6}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                          display: 'flex', padding: 4,
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => updateForm('confirmPassword', e.target.value)}
                      required
                    />
                  </div>

                  <motion.button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (form.username.length >= 3 && form.password.length >= 6 && form.password === form.confirmPassword) {
                        setStep(2);
                      } else {
                        if (form.password !== form.confirmPassword) useAuthStore.setState({ error: 'Passwords do not match.' });
                        else if (form.username.length < 3) useAuthStore.setState({ error: 'Username must be at least 3 characters.' });
                        else useAuthStore.setState({ error: 'Password must be at least 6 characters.' });
                      }
                    }}
                  >
                    Next Step <ArrowRight size={16} />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div className="input-group">
                    <label className="input-label">Bio (optional)</label>
                    <textarea
                      className="input"
                      placeholder="Tell us about yourself..."
                      value={form.bio}
                      onChange={(e) => updateForm('bio', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">What do you want to track?</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {CATEGORIES.map(cat => (
                        <motion.button
                          key={cat}
                          type="button"
                          className={`chip ${selectedCategories.includes(cat) ? 'active' : ''}`}
                          onClick={() => toggleCategory(cat)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {CATEGORY_LABELS[cat]}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Quick-start: bulk add top items */}
                  {selectedCategories.length > 0 && (
                    <div className="input-group">
                      <label className="input-label">Quick-start your list (optional)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                        {sampleMedia
                          .filter(m => selectedCategories.includes(m.category))
                          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                          .slice(0, 15)
                          .map(item => (
                            <motion.button
                              key={item.id}
                              type="button"
                              className={`chip ${quickPicks.includes(item.id) ? 'active' : ''}`}
                              onClick={() => setQuickPicks(prev =>
                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Star size={10} fill={quickPicks.includes(item.id) ? 'currentColor' : 'none'} />
                              {item.title}
                            </motion.button>
                          ))}
                      </div>
                      {quickPicks.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-accent)', marginTop: 4, fontWeight: 600 }}>
                          {quickPicks.length} selected -- will be added as "Plan to Start"
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={() => setStep(1)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft size={16} /> Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ flex: 2 }}
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
