import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available?: boolean; error?: string }>({ checking: false });
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const navigate = useNavigate();

  // Debounced username check
  useEffect(() => {
    const val = username.trim();
    if (val.length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }
    setUsernameStatus({ checking: true });
    const timer = setTimeout(() => {
      api.get(`/auth/check-username/?username=${encodeURIComponent(val)}`)
        .then((res) => setUsernameStatus({ checking: false, available: res.data.available, error: res.data.error }))
        .catch(() => setUsernameStatus({ checking: false }));
    }, 450);
    return () => clearTimeout(timer);
  }, [username]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (username.trim().length < 3) newErrors.username = 'At least 3 characters';
    else if (usernameStatus.available === false) newErrors.username = usernameStatus.error || 'Already taken';
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Enter a valid email';
    if (password.length < 8) newErrors.password = 'At least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/register/', { username: username.trim(), email: email.trim(), password, role });
      toast.success('Account created. Sign in to continue.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 lg:px-24 max-w-xl mx-auto w-full">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-14 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[#0A0A0B] font-bold text-sm">S</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">SkillProof</span>
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-white tracking-tight leading-tight">
            Create your account
          </h1>
          <p className="text-[#7A7A7D] text-[15px] mt-2">
            Get started with verified skill assessments.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-[#141415] border border-[#2A2A2D] rounded-lg p-1 mb-7">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
              role === 'candidate'
                ? 'bg-[#2A2A2D] text-white shadow-sm'
                : 'text-[#6A6A6D] hover:text-[#A0A0A3]'
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
              role === 'recruiter'
                ? 'bg-[#2A2A2D] text-white shadow-sm'
                : 'text-[#6A6A6D] hover:text-[#A0A0A3]'
            }`}
          >
            Recruiter
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-[#A0A0A3]">Username</label>
              {usernameStatus.checking ? (
                <span className="text-[11px] text-[#6A6A6D]">Checking…</span>
              ) : username.length >= 3 && usernameStatus.available ? (
                <span className="text-[11px] text-emerald-400">Available</span>
              ) : username.length >= 3 && usernameStatus.available === false ? (
                <span className="text-[11px] text-red-400">Taken</span>
              ) : null}
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s+/g, '').toLowerCase());
                if (errors.username) setErrors({ ...errors, username: undefined });
              }}
              placeholder="alexdev"
              className={`w-full bg-[#141415] border ${
                errors.username ? 'border-red-500/60' : 'border-[#2A2A2D] focus:border-[#505055]'
              } text-white text-[15px] rounded-lg px-3.5 py-2.5 focus:outline-none placeholder:text-[#4A4A4D] transition-colors`}
            />
            <AnimatePresence>
              {errors.username && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-1">
                  {errors.username}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-[#A0A0A3] mb-1.5">Email</label>
            <input
              type="email"
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

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#A0A0A3] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Min. 8 characters"
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
            className="w-full bg-white hover:bg-[#E8E8EA] text-[#0A0A0B] font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-[15px] mt-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Creating account…
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-[#6A6A6D]">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-[12px] text-[#4A4A4D] mt-6 leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Right: Visual panel */}
      <div className="hidden lg:flex flex-1 bg-[#111113] border-l border-[#1E1E21] items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="max-w-md relative z-10">
          {/* Feature showcase */}
          <h2 className="text-[22px] font-semibold text-white tracking-tight mb-3">
            {role === 'candidate' ? 'Prove what you can build.' : 'Hire with confidence.'}
          </h2>
          <p className="text-[#7A7A7D] text-[15px] leading-relaxed mb-12">
            {role === 'candidate'
              ? 'Take proctored coding assessments, earn verified badges, and get discovered by top companies — no resume fluff needed.'
              : 'Post roles, set skill benchmarks, and let verified candidates come to you. No more resume guesswork.'}
          </p>

          <div className="space-y-6">
            {(role === 'candidate' ? [
              { title: 'AI-proctored assessments', desc: 'Real coding challenges with live integrity monitoring' },
              { title: 'Verified skill badges', desc: 'Shareable proof of competency on your profile' },
              { title: 'Get discovered', desc: 'Top companies find you based on verified scores' },
            ] : [
              { title: 'Skill-verified talent pool', desc: 'Browse candidates ranked by proven ability' },
              { title: 'Custom job benchmarks', desc: 'Set minimum scores that candidates must meet' },
              { title: 'Faster hiring pipeline', desc: 'Skip screening rounds — go straight to interviews' },
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="w-5 h-5 rounded-full border border-[#2A2A2D] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-[14px] font-medium">{item.title}</p>
                  <p className="text-[#6A6A6D] text-[13px] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom trusted companies */}
          <div className="mt-16 pt-8 border-t border-[#1E1E21]">
            <p className="text-[12px] text-[#4A4A4D] uppercase tracking-wider font-medium mb-4">Trusted by teams at</p>
            <div className="flex items-center gap-6 text-[#3A3A3D]">
              {['Google', 'Microsoft', 'Amazon', 'Stripe'].map((name) => (
                <span key={name} className="text-[14px] font-semibold tracking-tight">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
