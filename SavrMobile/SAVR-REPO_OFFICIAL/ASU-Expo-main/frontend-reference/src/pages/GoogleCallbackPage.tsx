import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService, { GoogleCallbackResponse } from '../services/authService';

const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processing Google sign-in...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const googleAction = sessionStorage.getItem('google_action');

      // Clear the action flag
      sessionStorage.removeItem('google_action');

      if (errorParam) {
        const redirectPath = googleAction === 'link' ? '/profile' : '/login';
        setError(`Google sign-in was cancelled or failed: ${errorParam}`);
        setTimeout(() => navigate(redirectPath), 3000);
        return;
      }

      if (!code) {
        const redirectPath = googleAction === 'link' ? '/profile' : '/login';
        setError('No authorization code received from Google');
        setTimeout(() => navigate(redirectPath), 3000);
        return;
      }

      try {
        // Handle account linking from profile page
        if (googleAction === 'link' && authService.isAuthenticated()) {
          setStatus('Linking Google account...');
          const response: GoogleCallbackResponse = await authService.handleGoogleCallback(code);

          if (response.google_id) {
            // Link Google to the authenticated user
            await authService.linkGoogleAccountAuthenticated(response.google_id);
            setStatus('Google account linked successfully!');
            setTimeout(() => navigate('/profile'), 1500);
          } else if (response.access_token) {
            // Google account was already linked or user logged in
            setStatus('Account linked! Redirecting...');
            setTimeout(() => navigate('/profile'), 1500);
          } else {
            setError('Failed to link Google account');
            setTimeout(() => navigate('/profile'), 3000);
          }
          return;
        }

        setStatus('Authenticating with Google...');
        const response: GoogleCallbackResponse = await authService.handleGoogleCallback(code);

        if (response.access_token && response.user_id) {
          // User successfully logged in
          setStatus('Login successful! Redirecting...');
          const user = authService.getCurrentUser();
          if (user && (user as any).is_admin === true) {
            navigate('/admin');
          } else {
            navigate('/chat');
          }
        } else if (response.needs_signup) {
          // New Google user - needs to complete signup
          setStatus('Redirecting to complete signup...');
          // Store Google user data temporarily for signup completion
          sessionStorage.setItem('google_signup_data', JSON.stringify({
            google_id: response.google_id,
            email: response.email,
            first_name: response.first_name,
            last_name: response.last_name
          }));
          navigate('/signup/google');
        } else if (response.needs_link) {
          // Email account exists - needs to link
          setStatus('Account linking required...');
          sessionStorage.setItem('google_link_data', JSON.stringify({
            google_id: response.google_id,
            email: response.email,
            message: response.message
          }));
          navigate('/login/link-google');
        } else {
          setError('Unexpected response from server');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('Google callback error:', err);
        setError(err.message || 'Failed to authenticate with Google');
        const redirectPath = googleAction === 'link' ? '/profile' : '/login';
        setTimeout(() => navigate(redirectPath), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900"
      style={{ height: '100svh' }}
    >
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/assets/savr-logo(primary).svg"
            alt="Savr Logo"
            className="h-14 w-auto"
          />
        </div>

        {error ? (
          <>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <p className="text-gray-600 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            {/* Loading spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">{status}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
