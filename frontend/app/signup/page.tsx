'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  User,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Password strength logic
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Contains number', passed: /\d/.test(password) },
    { label: 'Contains special character', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.passed).length;

  const meta = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
    { label: 'Very strong', color: 'bg-emerald-500' },
  ];

  return { score, ...meta[score], checks };
}

export default function SignupPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userName.length < 3) return setError('Username must be at least 3 characters');
    if (strength.score < 2) return setError('Password is too weak. Please make it stronger.');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!agreedToTerms) return setError('You must agree to the Terms of Service');

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        userName,
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join the Solana AML Compliance Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  disabled={isLoading}
                  placeholder="yourname"
                  minLength={3}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimum 3 characters</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setShowStrength(true); }}
                  onFocus={() => setShowStrength(true)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength bar */}
              {showStrength && password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Strength: <span className="text-white font-medium">{strength.label}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {strength.checks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5">
                        {check.passed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${check.passed ? 'text-slate-300' : 'text-slate-500'}`}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 bg-slate-700/30 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 ${
                    passwordsMatch
                      ? 'border-green-500/50 focus:ring-green-400/40'
                      : passwordsMismatch
                      ? 'border-red-500/50 focus:ring-red-400/40'
                      : 'border-slate-600/50 focus:ring-blue-400/40'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordsMatch && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    agreedToTerms
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-slate-700/30 border-slate-600/50 group-hover:border-slate-500'
                  }`}
                >
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-400">
                I agree to the{' '}
                <Link href="#" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/30" />
            <span className="text-xs text-slate-500">Already have an account?</span>
            <div className="flex-1 h-px bg-slate-700/30" />
          </div>

          <p className="text-center text-slate-400">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Log in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Your data is protected with enterprise-grade encryption
        </p>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
