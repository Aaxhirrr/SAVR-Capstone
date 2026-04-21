import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../src/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const location = useLocation();
  
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser ? authService.getCurrentUser() : undefined;

  useEffect(() => {
    return () => {
    };
  }, [location.pathname]);

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs email verification
  if (authService.needsEmailVerification && authService.needsEmailVerification()) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  // Optional admin-only route support if roles contains 'admin'
  if (roles && roles.length > 0 && user && user.roles && Array.isArray(user.roles)) {
    const userHasRequiredRole = roles.some(role => (user.roles as string[]).includes(role));
    if (!userHasRequiredRole) {
      // User is authenticated but does not have required role
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  } else if (roles && roles.length > 0 && (!user || !user.roles)) {
    // If roles are required, but user has no roles (or user is null), redirect.
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Note: Server-side admin gating is enforced on API endpoints. We avoid client-side hard redirect
  // to prevent false negatives when local profile is stale. AdminPage will refresh profile and handle UI.

  return <>{children}</>;
};

export default ProtectedRoute; 