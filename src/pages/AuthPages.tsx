import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ApiService } from '../services/api';
import { User, LogIn, UserPlus, Package, MapPin, LogOut, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, navigate, showToast } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await ApiService.customerLogin(username.trim(), password);
      if (data.success && data.token && data.user) {
        login(data.token, data.user);
        showToast(`Welcome back, ${data.user.name || data.user.username}!`, 'success');
        if (data.user.role === 'admin') {
          navigate('admin');
        } else {
          navigate('account');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sign In to Your Account</h1>
          <p className="text-xs text-slate-400">Access your order history and saved delivery addresses</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Username or Email</label>
            <input
              type="text"
              placeholder="e.g. Kawshik or user@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3 text-center text-xs text-slate-400">
          <div>
            <span>Don't have an account? </span>
            <button onClick={() => navigate('register')} className="text-blue-400 hover:underline font-semibold">
              Create an Account
            </button>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between text-left">
            <div>
              <span className="text-blue-300 font-semibold block text-[11px]">Store Owner / Manager?</span>
              <span className="text-slate-400 text-[10px]">Access orders, stock & bKash transactions</span>
            </div>
            <button
              onClick={() => navigate('admin')}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 shadow"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { login, navigate, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await ApiService.customerRegister({ name, email, phone, password });
      if (data.success && data.token && data.user) {
        login(data.token, data.user);
        showToast('Registration successful! Welcome to NEXORA TECH.', 'success');
        navigate('account');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Register New Customer</h1>
          <p className="text-xs text-slate-400">Join Bangladesh's premier tech gadget network</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Farhan Hossain"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password *</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Already have an account? </span>
          <button onClick={() => navigate('login')} className="text-blue-400 hover:underline font-semibold">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export const AccountPage: React.FC = () => {
  const { user, logout, navigate } = useStore();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Please Sign In</h2>
        <p className="text-xs text-slate-400">You must be logged in to view your account dashboard.</p>
        <button
          onClick={() => navigate('login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Account</h1>
          <p className="text-xs text-slate-400 mt-1">Logged in as {user.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Customer Profile</span>
          <h3 className="text-base font-bold text-white">{user.name}</h3>
          <p className="text-xs text-slate-300 font-mono">{user.phone || 'Phone not set'}</p>
          <span className="inline-block text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 uppercase">
            {user.role}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Track an Order</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter your order number on our tracking page to check real-time courier dispatch status.
          </p>
          <button
            onClick={() => navigate('track-order')}
            className="text-xs font-semibold text-blue-400 hover:underline block pt-2"
          >
            Open Order Tracker &rarr;
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Saved Wishlist</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Review your saved gadget selections and quickly add them to your shopping bag.
          </p>
          <button
            onClick={() => navigate('wishlist')}
            className="text-xs font-semibold text-blue-400 hover:underline block pt-2"
          >
            View Wishlist &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
