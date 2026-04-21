import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatPage from './pages/ChatPage';
import FlyersPage from './pages/FlyersPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import ShareStorePage from './pages/ShareStorePage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import GoogleSignupPage from './pages/GoogleSignupPage';
import GoogleLinkPage from './pages/GoogleLinkPage';
import BlogListPage from './pages/BlogListPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminBlogPage from './pages/AdminBlogPage';
function App() {
  return (
    <div style={{ 
      minHeight: '100vh'
    }}>
      {/* Presence kickoff for non-Admin routes */}
      <div style={{display:'none'}} id="presence-kickoff" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
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
      </Routes>
      <Toaster />
    </div>
  );
}

export default App; 