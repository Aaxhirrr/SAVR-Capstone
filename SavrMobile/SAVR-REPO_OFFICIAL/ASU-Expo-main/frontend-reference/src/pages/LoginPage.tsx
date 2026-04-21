import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    try {
      await authService.login({ email, password });
      const user = authService.getCurrentUser();
      if (user && (user as any).is_admin === true) {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const authUrl = await authService.getGoogleAuthUrl();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || "Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="flex items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 px-4 sm:px-6 lg:px-8"
      style={{ height: '100svh' }}>
      {/* Loading Overlay */}
      {(loading || googleLoading) && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900 flex items-center justify-center">
          <div className="text-center flex flex-col items-center">
            {/* Spinning circle */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            </div>

            <p className="mt-6 text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              {googleLoading ? "Connecting to Google..." : "Signing in..."}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-md my-4" style={{ maxHeight: '95svh', overflowY: 'auto' }}>
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
            Welcome
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to your account to start saving on groceries
          </p>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center pt-2">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm pt-2">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="group relative flex w-full justify-center items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? "Connecting..." : "Sign in with Google"}
            </button>
          </div>

          <div className="text-sm text-center pt-2">
            <p>
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-green-600 hover:text-green-500">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 