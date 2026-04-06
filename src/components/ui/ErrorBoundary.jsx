import { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'var(--bg-primary)',
        }}>
          <motion.div
            style={{ textAlign: 'center', maxWidth: 480 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{
                width: 80, height: 80, borderRadius: 'var(--radius-xl)',
                background: 'rgba(248, 113, 113, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <AlertTriangle size={36} style={{ color: 'var(--red-400)' }} />
            </motion.div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              An unexpected error occurred. Don't worry, your data is safe.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={18} /> Reload Page
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              >
                <Home size={18} /> Go Home
              </button>
            </div>
            {this.state.error && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Error details
                </summary>
                <pre style={{
                  fontSize: 11, background: 'var(--bg-secondary)', padding: 12,
                  borderRadius: 'var(--radius-md)', overflow: 'auto', maxHeight: 200,
                  color: 'var(--red-400)',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
