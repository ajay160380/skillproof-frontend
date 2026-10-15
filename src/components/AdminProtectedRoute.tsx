import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader } from './Loader';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const AdminProtectedRoute = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
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

  // Check if role is authorized
  const allowedRoles = ['admin', 'superadmin', 'manager', 'auditor'];
  const isAuthorized = Boolean(
    user && (
      allowedRoles.includes(user.role) ||
      (user as any).is_staff ||
      (user as any).is_superuser
    )
  );

  // Unauthorized candidate or recruiter -> Show 403 Forbidden screen
  if (!isAuthorized) {
    const returnPath = user?.role === 'recruiter' ? '/recruiter' : '/dashboard';

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#0A0A0B] text-white">
        <div className="max-w-md w-full bg-[#141415] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
          
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
            403 Forbidden
          </span>

          <h2 className="text-xl font-bold text-white mt-3 mb-2">Administrator Access Required</h2>
          <p className="text-xs text-[#A0A0A3] leading-relaxed mb-6">
            Your account <span className="text-white font-mono">({user?.email})</span> is registered with the role <span className="text-amber-400 font-semibold uppercase">{user?.role}</span>. Access to the Operations & Governance suite is restricted to authorized Administrators and Auditors.
          </p>

          <div className="space-y-2.5">
            <Link
              to={returnPath}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to My Dashboard
            </Link>
            
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-red-500/10 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-red-400 flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign in with another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
