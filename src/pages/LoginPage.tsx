import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Required';
    if (!password) newErrors.password = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', { email: email.trim(), password });
      localStorage.setItem('access_token', response.data.access);
      const userRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      login(userRes.data, response.data.access, response.data.refresh);
      toast.success('Signed in successfully');
      navigate(userRes.data.role === 'recruiter' ? '/recruiter' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 max-w-xl mx-auto w-full">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-16 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[#0A0A0B] font-bold text-sm">S</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">SkillProof</span>
        </Link>

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-[28px] font-semibold text-white tracking-tight leading-tight">
            Sign in to your account
          </h1>
          <p className="text-[#7A7A7D] text-[15px] mt-2">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-[#A0A0A3] mb-1.5">
              Email or username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="you@company.com"
              className={`w-full bg-[#141415] border ${
                errors.email ? 'border-red-500/60' : 'border-[#2A2A2D] focus:border-[#505055]'
              } text-white text-[15px] rounded-lg px-3.5 py-2.5 focus:outline-none placeholder:text-[#4A4A4D] transition-colors`}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-1">
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-[#A0A0A3]">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="••••••••"
                className={`w-full bg-[#141415] border ${
                  errors.password ? 'border-red-500/60' : 'border-[#2A2A2D] focus:border-[#505055]'
                } text-white text-[15px] rounded-lg px-3.5 py-2.5 pr-10 focus:outline-none placeholder:text-[#4A4A4D] transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A6A6D] hover:text-white transition-colors text-xs font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-1">
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-[#E8E8EA] text-[#0A0A0B] font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-[15px] mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Signing in…
              </span>
            ) : 'Continue'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-[#6A6A6D]">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Visual panel (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-[#111113] border-l border-[#1E1E21] items-center justify-center p-16 relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px]" />
        
        <div className="max-w-md relative z-10">
          {/* Testimonial style content */}
          <div className="mb-12">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#2A2A2D] mb-8">
              <path d="M16 8H8C6.89543 8 6 8.89543 6 10V18C6 19.1046 6.89543 20 8 20H12L8 32H14L18 20V10C18 8.89543 17.1046 8 16 8Z" fill="currentColor"/>
              <path d="M32 8H24C22.8954 8 22 8.89543 22 10V18C22 19.1046 22.8954 20 24 20H28L24 32H30L34 20V10C34 8.89543 33.1046 8 32 8Z" fill="currentColor"/>
            </svg>
            <p className="text-[22px] text-[#D4D4D8] leading-relaxed font-normal">
              SkillProof replaced our 4-round interview loop with one verified assessment. We hired 3 senior engineers in under a week.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E1E21] flex items-center justify-center text-white text-sm font-semibold">
              RK
            </div>
            <div>
              <p className="text-white text-[14px] font-medium">Rahul Kumar</p>
              <p className="text-[#6A6A6D] text-[13px]">Engineering Lead, TechCorp</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-[#1E1E21]">
            <div>
              <div className="text-2xl font-semibold text-white tracking-tight">12k+</div>
              <div className="text-[13px] text-[#6A6A6D] mt-0.5">Verified candidates</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tracking-tight">94%</div>
              <div className="text-[13px] text-[#6A6A6D] mt-0.5">Hire accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white tracking-tight">2 days</div>
              <div className="text-[13px] text-[#6A6A6D] mt-0.5">Avg time-to-hire</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
