import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import PageTransition from '../components/ui/PageTransition';
import { AlertTriangle, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <PageTransition>
      <div className="auth-page">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="auth-logo">
            <motion.div
              className="auth-logo-icon"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              T
            </motion.div>
            <div className="auth-title">Welcome back</div>
            <div className="auth-subtitle">Sign in to your trky account</div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-warning">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Passwords cannot be recovered. If you lose your password, your account is gone forever. Write it down somewhere safe.</span>
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

            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
            </motion.button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
