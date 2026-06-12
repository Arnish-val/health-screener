import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth-context';
import { authApi } from '../../api/authApi';
import { Stethoscope, LogIn, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

void motion;

/**
 * AuthScreen — login + registration form.
 * Supports both dark mode (inner-app context) and light mode.
 * Fixes: btn-primary undefined, shows real FastAPI error messages,
 * client-side password length validation, better UX.
 */
export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  /* ── Client-side validation ────────────────────────────────── */
  const validate = () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    return true;
  };

  /* ── Form submit ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const data = await authApi.login(email, password);
        login(data.access_token);
        navigate(from, { replace: true });
      } else {
        // Register then auto-login
        await authApi.register(email, password);
        setSuccess('Account created! Signing you in…');
        const data = await authApi.login(email, password);
        login(data.access_token);
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Real error message from FastAPI detail field (fixed in client.js)
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Mode switch ───────────────────────────────────────────── */
  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setPassword('');
  };

  const passwordStrength = password.length === 0 ? null
    : password.length < 8 ? 'weak'
    : password.length < 12 ? 'medium'
    : 'strong';

  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-amber-400',
    strong: 'bg-emerald-500',
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-black/60 p-8 relative overflow-hidden">

          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-[#106EBE]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-[#106EBE] to-[#0FFCBE] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#106EBE]/25">
                <Stethoscope className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm leading-relaxed max-w-xs">
                {isLogin
                  ? 'Sign in to access your assessment history and saved results.'
                  : 'Create a free account to save and track your health screenings.'}
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
              {[
                { label: 'Sign In', val: true,  id: 'tab-signin'  },
                { label: 'Sign Up', val: false, id: 'tab-signup'  },
              ].map(({ label, val, id }) => (
                <button
                  key={label}
                  id={id}
                  type="button"
                  onClick={() => { setIsLogin(val); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isLogin === val
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success banner */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#106EBE] focus:ring-2 focus:ring-[#106EBE]/20 transition-all text-sm"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#106EBE] focus:ring-2 focus:ring-[#106EBE]/20 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar (sign up only) */}
                {!isLogin && password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {['weak', 'medium', 'strong'].map((level, i) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            passwordStrength === 'weak' && i === 0 ? strengthColor.weak :
                            passwordStrength === 'medium' && i <= 1 ? strengthColor.medium :
                            passwordStrength === 'strong' ? strengthColor.strong :
                            'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {passwordStrength === 'weak' && 'Too short — minimum 8 characters'}
                      {passwordStrength === 'medium' && 'Good — try adding numbers or symbols'}
                      {passwordStrength === 'strong' && '✓ Strong password'}
                    </p>
                  </div>
                )}

                {isLogin && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Minimum 8 characters required
                  </p>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#106EBE] hover:bg-[#0A4F8A] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[#106EBE]/25 transition-all text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[#106EBE] dark:text-[#4A9BE4] hover:underline font-semibold transition-colors"
                >
                  {isLogin ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Continue as Guest (no history saved)
              </button>
            </div>
          </div>
        </div>

        {/* Below card info */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-5 px-4">
          Your data is encrypted and never shared with third parties.
        </p>
      </motion.div>
    </div>
  );
}
