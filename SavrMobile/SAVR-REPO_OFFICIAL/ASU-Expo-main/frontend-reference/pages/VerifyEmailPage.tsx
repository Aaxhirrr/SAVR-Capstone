import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import authService from "../services/authService";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus("success");
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate("/chat", { replace: true });
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Verification failed");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 px-4 sm:px-6 lg:px-8"
      style={{ height: "100svh" }}
    >
      <Helmet>
        <title>Verify Email - Savr</title>
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
          {status === "loading" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                <svg
                  className="animate-spin h-7 w-7 text-green-600"
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying your email...
              </h2>
              <p className="text-gray-600">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-7 w-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email verified!
              </h2>
              <p className="text-gray-600 mb-4">
                Your email has been verified successfully. Welcome to Savr!
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Redirecting you to the app in a few seconds...
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-md bg-green-600 py-2.5 px-6 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                Go to Savr
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-7 w-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification failed
              </h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Link
                  to="/verify-email-pending"
                  className="block w-full rounded-md bg-green-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-green-700 transition text-center"
                >
                  Request a new link
                </Link>
                <Link
                  to="/login"
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
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
