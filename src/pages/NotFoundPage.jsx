import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <motion.div
        className="not-found-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="not-found-code"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        >
          404
        </motion.div>
        <div className="not-found-title">Page not found</div>
        <div className="not-found-text">
          The page you're looking for doesn't exist or has been moved.
          Maybe try heading back home?
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/" className="btn btn-primary btn-lg">
              <Home size={18} /> Go Home
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <button className="btn btn-secondary btn-lg" onClick={() => window.history.back()}>
              <ArrowLeft size={18} /> Go Back
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
