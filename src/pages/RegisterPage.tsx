import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { api } from '../services/api';
import { Logo } from '../components/Logo';
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

  // Debounced username availability check
  useEffect(() => {
    const val = username.trim();
    if (val.length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }

    setUsernameStatus({ checking: true });
    const timer = setTimeout(() => {
      api.get(`/auth/check-username/?username=${encodeURIComponent(val)}`)
        .then((res) => {
          setUsernameStatus({ checking: false, available: res.data.available, error: res.data.error });
        })
        .catch(() => {
          setUsernameStatus({ checking: false });
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const validate = () => {
    const newErrors: typeof errors = {};
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameStatus.available === false && usernameStatus.error) {
      newErrors.username = usernameStatus.error;
    } else if (usernameStatus.available === false) {
      newErrors.username = 'Username is already taken';
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/auth/register/', {
        username: username.trim(),
        email: email.trim(),
        password,
        role
      });
      toast.success('Account created! Please sign in to verify your identity.', {
        icon: '🚀',
        style: {
          background: '#0F172A',
          color: '#fff',
          border: '1px solid rgba(16, 185, 129, 0.4)'
        }
      });
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] relative overflow-hidden flex flex-col justify-between text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Aurora Gradients */}
      <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-[32rem] h-[32rem] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[28rem] h-[28rem] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo theme="light" size="md" />
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:inline font-mono">ALREADY REGISTERED?</span>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-2 group"
          >
            Sign In
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto"
          >
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative overflow-hidden">
              {/* Top Accent Glow Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 tracking-wide uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Account Registration
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Join SkillProof
                </h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Create your profile to unlock proctored AI skill certifications or hire verified talent.
                </p>
              </div>

              {/* Role Toggle Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                    role === 'candidate'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                    role === 'recruiter'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Recruiter / Hiring
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Username
                    </label>
                    {usernameStatus.checking ? (
                      <span className="text-[10px] text-amber-400 font-mono animate-pulse">Checking...</span>
                    ) : username.length >= 3 && usernameStatus.available ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                    ) : username.length >= 3 && usernameStatus.available === false ? (
                      <span className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Unavailable
                      </span>
                    ) : null}
                  </div>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s+/g, '').toLowerCase();
                        setUsername(val);
                        if (errors.username) setErrors({ ...errors, username: undefined });
                      }}
                      placeholder="e.g. alexdev"
                      className={`w-full bg-slate-950/70 border ${
                        errors.username ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-white text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 ${
                        errors.username ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20'
                      } placeholder:text-slate-600 transition-all font-sans`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-rose-400 text-xs mt-1.5 font-sans"
                      >
                        {errors.username}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="alex@company.com"
                      className={`w-full bg-slate-950/70 border ${
                        errors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-white text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 ${
                        errors.email ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20'
                      } placeholder:text-slate-600 transition-all font-sans`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-rose-400 text-xs mt-1.5 font-sans"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Password (Min. 8 Characters)
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="••••••••••••"
                      className={`w-full bg-slate-950/70 border ${
                        errors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-white text-sm rounded-xl pl-11 pr-11 py-3.5 focus:outline-none focus:ring-2 ${
                        errors.password ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20'
                      } placeholder:text-slate-600 transition-all font-sans`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-white transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-rose-400 text-xs mt-1.5 font-sans"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Creating Profile...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create {role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Login Prompt */}
              <div className="mt-6 pt-5 border-t border-white/5 text-center">
                <p className="text-xs text-slate-400 font-sans">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Dynamic Preview by Role */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center items-center relative pl-4">
            <motion.div
              key={role}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative"
            >
              {role === 'candidate' ? (
                <>
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Candidate Verification Journey</h3>
                        <p className="text-xs text-slate-400 font-mono">Proof Over Guesswork</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                      FREE TIER
                    </span>
                  </div>

                  <div className="space-y-4 my-6">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs flex-shrink-0">1</div>
                      <div>
                        <div className="text-sm font-bold text-white">Upload Resume & AI Skill Parse</div>
                        <div className="text-xs text-slate-400 mt-0.5">Automated deep extraction with matched technical assessments.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 font-mono font-bold text-xs flex-shrink-0">2</div>
                      <div>
                        <div className="text-sm font-bold text-white">Complete Proctored Coding Tests</div>
                        <div className="text-xs text-slate-400 mt-0.5">Real code challenges with live webcam and tab anti-cheat detection.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs flex-shrink-0">3</div>
                      <div>
                        <div className="text-sm font-bold text-white">Receive Undeniable Proof Badge</div>
                        <div className="text-xs text-slate-400 mt-0.5">Share cryptographic certificate directly on LinkedIn and job applications.</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Recruiter Intelligence Hub</h3>
                        <p className="text-xs text-slate-400 font-mono">Zero Resume Fraud</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-medium">
                      ENTERPRISE READY
                    </span>
                  </div>

                  <div className="space-y-4 my-6">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs flex-shrink-0">1</div>
                      <div>
                        <div className="text-sm font-bold text-white">Post Verified Job Openings</div>
                        <div className="text-xs text-slate-400 mt-0.5">Set minimum benchmark scores required to apply automatically.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs flex-shrink-0">2</div>
                      <div>
                        <div className="text-sm font-bold text-white">Auto-Rank Candidates by Proof</div>
                        <div className="text-xs text-slate-400 mt-0.5">Inspect verified code submissions, anti-cheat confidence & percentile ranks.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs flex-shrink-0">3</div>
                      <div>
                        <div className="text-sm font-bold text-white">Schedule 1-Click Interviews</div>
                        <div className="text-xs text-slate-400 mt-0.5">Directly connect with pre-vetted engineers without screening overhead.</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>🛡️ SHA-256 Verified Ledger</span>
                <span>🔒 GDPR & Anti-Cheat Compliant</span>
              </div>
            </motion.div>

            {/* Quick Trust Badges */}
            <div className="flex items-center gap-6 mt-8 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Bank-grade encryption</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> Instant activation</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="relative z-20 px-6 sm:px-12 py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono max-w-7xl mx-auto w-full">
        <div>&copy; {new Date().getFullYear()} SkillProof. End-to-end verified skill infrastructure.</div>
        <div className="flex items-center gap-6 mt-2 sm:mt-0">
          <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <Link to="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          <a href="mailto:hello@skillproof.app" className="hover:text-slate-300 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
