import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If token exists, direct to home
    if (localStorage.getItem('stocksense_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await api.register({ name, email, password });
        // Auto login after registration
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const loginRes = await api.login(formData);
        
        localStorage.setItem('stocksense_token', loginRes.access_token);
        localStorage.setItem('stocksense_user', JSON.stringify({ name, email }));
        navigate('/');
      } else {
        // Login flow
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const loginRes = await api.login(formData);
        
        // Decode token to extract name (rough estimation or fetch details)
        // For simple MVP we can save the email as user info
        localStorage.setItem('stocksense_token', loginRes.access_token);
        localStorage.setItem('stocksense_user', JSON.stringify({ name: email.split('@')[0], email }));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/20 dark:border-zinc-800/40 shadow-glass-light dark:shadow-glass-dark relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/30 mb-3">
            S
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            {isRegister ? 'Sign up for StockSense AI' : 'Sign in to manage store inventory'}
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 dark:bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/20 px-4 py-3 rounded-xl text-sm mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full glass-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full glass-input"
              placeholder="manager@retailstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all duration-150 disabled:opacity-50 mt-6"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
