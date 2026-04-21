import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import authService from "../services/authService";

const VerifyEmailPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Get user email from localStorage
  const user = authService.getCurrentUser ? authService.getCurrentUser() : null;
  const email = user?.email || "";

  // If not authenticated or already verified, redirect
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!authService.needsEmailVerification()) {
      navigate("/chat", { replace: true });
    }
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    setError("");
    setResent(false);
    try {
      await authService.resendVerification();
      setResent(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 px-4 sm:px-6 lg:px-8"
      style={{ height: "100svh" }}
    >
      <Helmet>
        <title>Verify Your Email - Savr</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div
        className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-md my-4"
        style={{ maxHeight: "95svh", overflowY: "auto" }}
      >
        <div className="flex justify-center mb-3">
          <Link to="/">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr Logo"
              className="h-12 sm:h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        <div className="text-center">
          {/* Email icon */}
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>

          <p className="text-gray-600 mb-2">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-gray-900 font-semibold mb-4">{email}</p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to verify your account and start using Savr.
          </p>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {resent && !error && (
            <div
              className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded relative mb-4 text-sm"
              role="status"
            >
              Verification email sent! Check your inbox.
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full rounded-md border border-transparent bg-green-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150 mb-3"
          >
            {resending ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              "Resend verification email"
            )}
          </button>

          <p className="text-xs text-gray-400 mb-6">
            Didn't receive an email? Check your spam folder.
          </p>

          {/* Back to login link */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center text-green-600 hover:text-green-500 font-medium text-sm"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPendingPage;
