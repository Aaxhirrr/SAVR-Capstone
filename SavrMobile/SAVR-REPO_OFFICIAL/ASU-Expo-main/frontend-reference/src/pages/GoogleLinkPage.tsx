import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

interface GoogleLinkData {
  google_id: string;
  email: string;
  message?: string;
}

const GoogleLinkPage: React.FC = () => {
  const navigate = useNavigate();
  const [linkData, setLinkData] = useState<GoogleLinkData | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get Google link data from session storage
    const storedData = sessionStorage.getItem('google_link_data');
    if (!storedData) {
      navigate('/login');
      return;
    }

    try {
      const data = JSON.parse(storedData) as GoogleLinkData;
      setLinkData(data);
    } catch (e) {
      console.error('Error parsing Google link data:', e);
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!linkData) {
      setError('Google authentication data is missing. Please try again.');
      return;
    }

    setLoading(true);

    try {
      await authService.linkGoogleAccount({
        email: linkData.email,
        password,
        google_id: linkData.google_id
      });

      // Clear the session storage
      sessionStorage.removeItem('google_link_data');

      // Check if admin and redirect
      const user = authService.getCurrentUser();
      if (user && (user as any).is_admin === true) {
        navigate('/admin');
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link account. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  if (!linkData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 px-4 sm:px-6 lg:px-8"
      style={{ height: '100svh' }}
    >
      {loading && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              Linking account...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-md my-4">
        <div className="flex justify-center mb-3">
          <Link to="/">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr Logo"
              className="h-12 sm:h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Link Your Google Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            An account with <span className="font-medium">{linkData.email}</span> already exists.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Enter your password to link your Google account.
          </p>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {linkData.message && !error && (
          <div
            className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{linkData.message}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150"
            >
              {loading ? 'Linking...' : 'Link Account & Sign In'}
            </button>
          </div>

          <div className="text-sm text-center pt-2 space-y-2">
            <p>
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500"
                onClick={() => sessionStorage.removeItem('google_link_data')}
              >
                Cancel and sign in with password instead
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleLinkPage;
