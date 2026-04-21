import { Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy, Component, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';

// Retry dynamic imports once with a full page reload on chunk load failure
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    factory().catch(() => {
      // Chunk failed to load (stale hash after rebuild) — reload once
      const key = 'chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      // Return a never-resolving promise to prevent render while reloading
      return new Promise(() => {});
    })
  );
}

// Error boundary to catch any remaining lazy-load or render errors
class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            A new version is available
          </h1>
          <p className="text-gray-600 mb-6">
            Please refresh the page to load the latest version.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LandingPage = lazyWithRetry(() => import('./pages/LandingPage'));
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage'));
const SignupPage = lazyWithRetry(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage'));
const ChatPage = lazyWithRetry(() => import('./pages/ChatPage'));
const FlyersPage = lazyWithRetry(() => import('./pages/FlyersPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'));
const PrivacyPage = lazyWithRetry(() => import('./pages/PrivacyPage'));
const TermsPage = lazyWithRetry(() => import('./pages/TermsPage'));
const ShareStorePage = lazyWithRetry(() => import('./pages/ShareStorePage'));
const GoogleCallbackPage = lazyWithRetry(() => import('./pages/GoogleCallbackPage'));
const GoogleSignupPage = lazyWithRetry(() => import('./pages/GoogleSignupPage'));
const GoogleLinkPage = lazyWithRetry(() => import('./pages/GoogleLinkPage'));
const BlogListPage = lazyWithRetry(() => import('./pages/BlogListPage'));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPostPage'));
const AdminBlogPage = lazyWithRetry(() => import('./pages/AdminBlogPage'));
const VerifyEmailPendingPage = lazyWithRetry(() => import('./pages/VerifyEmailPendingPage'));
const VerifyEmailPage = lazyWithRetry(() => import('./pages/VerifyEmailPage'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 px-4">
      <Helmet>
        <title>Page Not Found - Savr</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-flex items-center px-6 py-3 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <div style={{
      minHeight: '100vh'
    }}>
      <Helmet>
        <title>Savr - Compare Grocery Prices Across Canadian Stores</title>
        <meta name="description" content="Savr helps you compare grocery prices across Canadian stores like Loblaws, No Frills, Walmart, Sobeys, and more. Create smart shopping lists and save money every week." />
        <meta property="og:site_name" content="Savr" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://savr.app/assets/savr-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://savr.app/assets/savr-og.png" />
      </Helmet>
      {/* Presence kickoff for non-Admin routes */}
      <div style={{display:'none'}} id="presence-kickoff" />
      <ChunkErrorBoundary>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Email verification routes */}
          <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* Google OAuth routes */}
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/signup/google" element={<GoogleSignupPage />} />
          <Route path="/login/link-google" element={<GoogleLinkPage />} />
          {/* Public share route (read-only) */}
          <Route path="/share/list/:listId/store/:store" element={<ShareStorePage />} />

          {/* Wrap protected routes with Layout */}
          <Route element={<Layout />}>
            <Route path="/flyers" element={
              <ProtectedRoute>
                <FlyersPage />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/blog" element={
              <ProtectedRoute>
                <AdminBlogPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/" element={<LandingPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
      <Toaster />
    </div>
  );
}

export default App;
