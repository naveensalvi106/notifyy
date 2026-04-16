import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import notifyLogo from '@/assets/notify-logo.jpeg';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (name: string) => void;
}

export default function Login({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() || 'User' } },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || 'Google sign-in failed');
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Decorative floating notes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {['yellow', 'pink', 'blue', 'green', 'mint', 'purple', 'orange'].map((c, i) => (
          <motion.div
            key={c}
            className={`absolute w-16 h-16 rounded-2xl note-card-${c} opacity-20`}
            style={{ top: `${10 + i * 12}%`, left: `${5 + (i % 3) * 35}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 rounded-3xl glass-strong mx-auto mb-4 overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <img src={notifyLogo} alt="Notify" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl font-heading font-extrabold gradient-text">Notify</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-body outline-none glass-input"
              />
            </motion.div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-body outline-none glass-input"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-body outline-none glass-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {!isSignup && (
            <div className="text-right">
              <button type="button" className="text-xs text-primary font-body font-semibold">
                Forgot password?
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3.5 rounded-2xl glass-fab text-primary-foreground font-heading font-bold text-base flex items-center justify-center gap-2"
          >
            {isSignup ? 'Create Account' : 'Sign In'}
            <ArrowRight size={18} />
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-body">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 rounded-2xl glass-btn font-body font-bold text-sm text-foreground/70"
        >
          {loading ? 'Signing in...' : 'Google'}
        </motion.button>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground font-body mt-6">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-primary font-bold"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
