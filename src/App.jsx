import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import './stores/themeStore'; // Initialize theme on load
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useScrollToTop } from './hooks/useScrollToTop';
import Sidebar from './components/layout/Sidebar';
import ToastContainer from './components/ui/Toast';
import BackToTop from './components/ui/BackToTop';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage'));
const MyListPage = lazy(() => import('./pages/MyListPage'));
const ChatroomsPage = lazy(() => import('./pages/ChatroomsPage'));
const ChatViewPage = lazy(() => import('./pages/ChatViewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const WrappedPage = lazy(() => import('./pages/WrappedPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LoginPrompt = lazy(() => import('./components/auth/LoginPrompt'));

// Loading fallback
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border-light)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</span>
    </div>
  );
}

function AuthenticatedApp() {
  const showLoginPrompt = useAuthStore(s => s.showLoginPrompt);
  const location = useLocation();
  useKeyboardShortcuts();
  useScrollToTop();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/browse/:category" element={<BrowsePage />} />
              <Route path="/media/:id" element={<MediaDetailPage />} />
              <Route path="/my-list" element={<MyListPage />} />
              <Route path="/chat" element={<ChatroomsPage />} />
              <Route path="/chat/:chatroomId" element={<ChatViewPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/wrapped" element={<WrappedPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <AnimatePresence>
          {showLoginPrompt && <LoginPrompt />}
        </AnimatePresence>
      </Suspense>
      <ToastContainer />
      <BackToTop />
    </div>
  );
}

function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
        <ToastContainer />
      </>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
