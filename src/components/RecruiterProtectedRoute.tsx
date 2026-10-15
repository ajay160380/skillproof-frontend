import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader } from './Loader';
import toast from 'react-hot-toast';

export const RecruiterProtectedRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader />
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If candidate -> strictly redirect to candidate dashboard
  if (user?.role === 'candidate') {
    toast.error('Recruiter account required to access this portal', { id: 'recruiter-only' });
    return <Navigate to="/dashboard" replace />;
  }

  const isRecruiterAuthorized = Boolean(
    user && (
      user.role === 'recruiter' ||
      ['admin', 'superadmin', 'manager'].includes(user.role) ||
      (user as any).is_staff ||
      (user as any).is_superuser
    )
  );

  if (!isRecruiterAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
