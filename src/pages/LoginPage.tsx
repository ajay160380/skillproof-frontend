import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, ChevronRight, Award, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/Logo';
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
    if (!email.trim()) {
      newErrors.email = 'Please enter your username or email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
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
      toast.success('Identity verified. Welcome back!', {
        icon: '🛡️',
        style: {
          background: '#0F172A',
          color: '#fff',
          border: '1px solid rgba(16, 185, 129, 0.4)'
        }
      });
      
      if (userRes.data.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] relative overflow-hidden flex flex-col justify-between text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Aurora Gradients */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo theme="light" size="md" />
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:inline font-mono">NEW TO SKILLPROOF?</span>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-2 group"
          >
            Create Account
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Column: Sign In Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto"
          >
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative overflow-hidden">
              {/* Top Accent Glow Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
              
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 tracking-wide uppercase font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Secure Access Portal
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Enter your credentials to access your verified assessments, score badges, and talent dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username or Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                    Username or Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="alex or alex@example.com"
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Password
                    </label>
                    <span className="text-xs text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer">
                      Forgot?
                    </span>
                  </div>
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
                  className="w-full mt-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Register Prompt */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-slate-400 font-sans">
                  Don't have an account yet?{' '}
                  <Link to="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-colors">
                    Register for Free
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Live Proof & Verification Showcase */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center items-center relative pl-4">
            
            {/* Interactive Dossier Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-full max-w-lg bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">SkillProof Verified Dossier</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: SP-9924-PLATINUM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE VERIFIED
                </div>
              </div>

              {/* Score Showcase */}
              <div className="grid grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-2xl font-black text-emerald-400 font-mono">94%</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-1">Verified Score</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-2xl font-black text-cyan-400 font-mono">Top 2%</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-1">Global Percentile</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <div className="text-2xl font-black text-amber-400 font-mono">99.8%</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-1">Integrity Rate</div>
                </div>
              </div>

              {/* Verified Competencies */}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Demonstrated Competencies
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Python AI Architecture', 'FastAPI & Celery', 'PostgreSQL Optimization', 'Docker & Kubernetes', 'System Design'].map((skill) => (
                    <span 
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recruiter Quote Banner */}
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs flex-shrink-0">
                  HR
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "SkillProof replaced 4 rounds of resume guessing with irrefutable, proctored code evaluations."
                </p>
              </div>
            </motion.div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-3 gap-6 mt-8 max-w-lg w-full text-center">
              <div>
                <div className="text-xl font-extrabold text-white">50,000+</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Skills Tested</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-white">100%</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Proctored AI</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-white">48 Hours</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Avg Hire Time</div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="relative z-20 px-6 sm:px-12 py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono max-w-7xl mx-auto w-full">
        <div>&copy; {new Date().getFullYear()} SkillProof. End-to-end verified skill infrastructure.</div>
        <div className="flex items-center gap-6 mt-2 sm:mt-0">
          <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link>
          <a href="mailto:hello@skillproof.app" className="hover:text-slate-300 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
