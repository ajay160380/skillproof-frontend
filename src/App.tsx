import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader } from './components/Loader';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const CandidateDashboard = lazy(() => import('./pages/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard').then(m => ({ default: m.RecruiterDashboard })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const TestScreen = lazy(() => import('./pages/TestScreen').then(m => ({ default: m.TestScreen })));
const ScoreReveal = lazy(() => import('./pages/ScoreReveal').then(m => ({ default: m.ScoreReveal })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const JobsBrowser = lazy(() => import('./pages/JobsBrowser').then(m => ({ default: m.JobsBrowser })));
const JobDetail = lazy(() => import('./pages/JobDetail').then(m => ({ default: m.JobDetail })));
const PostJob = lazy(() => import('./pages/PostJob').then(m => ({ default: m.PostJob })));
const RecruiterJobs = lazy(() => import('./pages/RecruiterJobs').then(m => ({ default: m.RecruiterJobs })));
const FollowersList = lazy(() => import('./pages/FollowersList').then(m => ({ default: m.FollowersList })));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate').then(m => ({ default: m.VerifyCertificate })));

import { useAuthStore } from './store/authStore';
import { api } from './services/api';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  // If it's a chunk load error, automatically refresh the page once
  if (error.name === 'ChunkLoadError' || error.message.includes('dynamically imported module')) {
    window.location.reload();
    return null;
  }
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-ink text-vellum p-8 text-center">
      <div className="font-sans text-3xl mb-4 text-red-500">Application Error</div>
      <p className="font-mono text-sm text-data max-w-md mb-8">{error.message}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-verification text-ink rounded-md font-bold uppercase tracking-widest font-mono text-xs">Reload App</button>
    </div>
  );
}

function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50); // slight delay to ensure rendering is done if navigating from another page
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return null;
}

function App() {
  const { setUser, setLoading, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me/')
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          // Only log out if explicitly unauthenticated (401)
          if (err.response?.status === 401) {
            logout();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading, logout]);

  return (
    <>
      <ScrollToHash />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'var(--color-ink)',
            color: 'var(--color-vellum)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '6px', // match rounded-md
            border: '1px solid var(--color-structure)',
          },
        }} 
      />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]"><Loader /></div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify/:id?" element={<VerifyCertificate />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="recruiter" element={<RecruiterDashboard />} />
              <Route path="test/:id" element={<TestScreen />} />
              <Route path="jobs/post" element={<PostJob />} />
              <Route path="jobs/my-listings" element={<RecruiterJobs />} />
              <Route path="followers" element={<FollowersList />} />
            </Route>

            <Route path="profile/:id" element={<PublicProfile />} />
            <Route path="score/:id" element={<ScoreReveal />} />
            <Route path="jobs" element={<JobsBrowser />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AnimatePresence>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
