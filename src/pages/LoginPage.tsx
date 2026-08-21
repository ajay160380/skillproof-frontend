import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const FloatingLabelInput = ({ label, type, value, onChange, error, placeholder }: any) => {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div className="relative mb-6">
      <motion.label
        initial={false}
        animate={{
          y: isFloating ? -24 : 12,
          scale: isFloating ? 0.8 : 1,
          color: error ? 'var(--color-seal)' : isFloating ? 'var(--color-ink)' : 'var(--color-data)'
        }}
        className="absolute left-4 font-mono text-xs uppercase tracking-wider pointer-events-none origin-left bg-white px-1"
      >
        {label}
      </motion.label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-xl ${
          error ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'
        }`}
        placeholder={focused ? placeholder : ''}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-seal text-xs mt-2 font-mono absolute -bottom-5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (email.length === 0) {
      newErrors.email = 'Please enter your username or email address';
    }
    if (password.length === 0) {
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
      
      // Fetch user profile
      localStorage.setItem('access_token', response.data.access);
      const userRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      login(userRes.data, response.data.access, response.data.refresh);
      toast.success('Access Granted');
      
      if (userRes.data.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
      // Shake animation effect for form on error can be implemented here via state
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 flex min-h-screen bg-mesh-light"
    >
      {/* Left side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 100 }}
          className="w-full max-w-md glass-panel rounded-[2rem] p-10 shadow-2xl"
        >
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200, damping: 20 }}
              className="w-14 h-14 bg-ink rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3"
            >
              <div className="w-5 h-5 bg-verification rounded-full"></div>
            </motion.div>
            <h2 className="font-serif text-4xl mb-2 text-ink">Access Portal</h2>
            <p className="font-mono text-xs text-data uppercase tracking-widest">Identify Yourself</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingLabelInput
              label="Username or Email"
              type="text"
              value={email}
              onChange={(e: any) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              placeholder="username or candidate@example.com"
            />
            
            <FloatingLabelInput
              label="Password"
              type="password"
              value={password}
              onChange={(e: any) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              placeholder="••••••••"
            />
            
            <motion.button 
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-ink text-vellum py-4 mt-8 font-semibold hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 rounded-xl shadow-xl hover:shadow-2xl flex items-center justify-center relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]"></div>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-data">
              Unverified? <Link to="/register" className="text-ink font-medium hover:underline decoration-verification underline-offset-4">Register here</Link>
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Right side: Visuals (hidden on small screens) */}
      <div className="hidden lg:flex flex-1 relative bg-mesh-dark items-center justify-center overflow-hidden rounded-l-[3rem] my-4 mr-4 shadow-2xl border border-white/10">
        
        <div className="z-10 text-center p-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-[28rem] h-[28rem] border-[0.5px] border-white/10 rounded-full flex items-center justify-center mx-auto mb-12 relative animate-float"
          >
            <div className="absolute inset-0 border-[0.5px] border-verification/20 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
            <div className="w-80 h-80 border-[0.5px] border-white/20 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 border-[0.5px] border-white/30 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md shadow-2xl">
                <span className="font-serif text-5xl text-white tracking-widest">SP</span>
              </div>
            </div>
          </motion.div>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-serif text-4xl text-white mb-4"
          >
            Welcome back to SkillProof.
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 max-w-md mx-auto text-sm leading-relaxed"
          >
            Your verified credentials await. Log in to continue proving your skills to the world.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
