'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, Wallet, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'wallet'>('email');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      // This will connect to Solana wallet
      // For now, showing placeholder
      alert('Wallet connection will be implemented with useWallet hook');
      setIsLoading(false);
    } catch (err: any) {
      setError('Wallet connection failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center px-4 py-12">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AML Suite</h1>
          <p className="text-slate-400">Secure Anti-Money Laundering Monitor</p>
        </div>

        {/* Main card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Auth method tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                authMethod === 'email'
                  ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300'
                  : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/30'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setAuthMethod('wallet')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                authMethod === 'wallet'
                  ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300'
                  : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/30'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Wallet
            </button>
          </div>

          {/* Email Login Form */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600/50 bg-slate-700/30 cursor-pointer"
                  />
                  <span className="text-sm text-slate-400">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          )}

          {/* Wallet Login */}
          {authMethod === 'wallet' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-4">
                Connect your Solana wallet to continue securely
              </p>
              <button
                onClick={handleWalletLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 text-center">
                We use Phantom, Solflare, or other Solana-compatible wallets
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/30"></div>
            <span className="text-xs text-slate-500">New user?</span>
            <div className="flex-1 h-px bg-slate-700/30"></div>
          </div>

          {/* Sign up link */}
          <p className="text-center text-slate-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By logging in, you agree to our{' '}
          <Link href="#" className="hover:text-slate-400">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="#" className="hover:text-slate-400">
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
