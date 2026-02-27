'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, Eye, Lock, TrendingUp, AlertTriangle,
  ArrowRight, Terminal, Globe, ChevronRight,
} from 'lucide-react';

const STATS = [
  { value: '$4.3B', label: 'AML fines in 2023', sub: 'Binance alone' },
  { value: '2,000+', label: 'DeFi protocols', sub: 'Need compliance' },
  { value: '<1s', label: 'Detection speed', sub: 'Real-time blocking' },
  { value: '100', label: 'Risk scoring', sub: 'ML-powered 0-100' },
];

const FEATURES = [
  {
    icon: Eye,
    title: 'REAL-TIME MONITORING',
    desc: 'Every Solana transaction analyzed instantly. Suspicious patterns flagged before damage is done.',
    color: 'var(--bat-gold)',
  },
  {
    icon: Lock,
    title: 'ON-CHAIN ENFORCEMENT',
    desc: 'Transfer Hook extension blocks blacklisted wallets automatically. No manual review needed.',
    color: '#00d4ff',
  },
  {
    icon: TrendingUp,
    title: 'ML RISK SCORING',
    desc: 'Velocity, pattern, age, and graph analysis combine into a single 0-100 risk score per wallet.',
    color: '#00ff88',
  },
  {
    icon: AlertTriangle,
    title: 'PATTERN DETECTION',
    desc: 'Structuring, rapid movement, round numbers, mixer usage — all detected automatically.',
    color: '#ff3333',
  },
  {
    icon: Globe,
    title: 'COMPLIANCE DASHBOARD',
    desc: 'Exportable reports for regulators. Audit trails, blacklist management, multi-protocol support.',
    color: '#a855f7',
  },
  {
    icon: Terminal,
    title: 'DEVELOPER API',
    desc: 'REST API + WebSocket. Integrate AML compliance into any Solana protocol in minutes.',
    color: 'var(--bat-gold)',
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return <span>{target}{suffix}</span>;
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bat-grid-bg" style={{ background: 'var(--bat-black)' }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 50 ? 'rgba(5,5,8,0.95)' : 'transparent',
          borderBottom: scrollY > 50 ? '1px solid rgba(245,197,24,0.1)' : 'none',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center bat-glitch"
              style={{ background: 'var(--bat-gold)', boxShadow: '0 0 20px var(--bat-gold-glow-strong)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--bat-black)' }} />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-widest" style={{ color: 'var(--bat-gold)' }}>
                AML
              </span>
              <span className="font-display text-lg font-bold tracking-widest text-white"> SUITE</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Architecture', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-body font-semibold text-sm tracking-widest uppercase transition-colors"
                style={{ color: 'var(--bat-text-dim)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bat-btn bat-btn-ghost px-5 py-2 rounded text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bat-btn bat-btn-primary px-5 py-2 rounded text-sm"
            >
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial gold glow from center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.06) 0%, transparent 70%)' }}
          />
          {/* Top corner accent */}
          <div
            className="absolute top-0 right-0 w-96 h-96"
            style={{ background: 'radial-gradient(circle at top right, rgba(245,197,24,0.08) 0%, transparent 60%)' }}
          />
          {/* Bottom left accent */}
          <div
            className="absolute bottom-0 left-0 w-80 h-80"
            style={{ background: 'radial-gradient(circle at bottom left, rgba(0,212,255,0.06) 0%, transparent 60%)' }}
          />
          {/* Diagonal lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diag" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <line x1="0" y1="60" x2="60" y2="0" stroke="rgba(245,197,24,0.3)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag)" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border"
            style={{
              background: 'rgba(245,197,24,0.08)',
              borderColor: 'rgba(245,197,24,0.2)',
            }}
          >
            <div className="w-2 h-2 rounded-full live-dot" style={{ background: 'var(--bat-gold)' }} />
            <span className="font-body font-semibold text-sm tracking-widest uppercase" style={{ color: 'var(--bat-gold)' }}>
              Built on Solana · Token Extensions · Devnet Live
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-display font-black mb-6 leading-none">
            <span
              className="block text-5xl md:text-7xl lg:text-8xl tracking-tight"
              style={{
                color: 'var(--bat-text-bright)',
                textShadow: '0 0 60px rgba(245,197,24,0.15)',
              }}
            >
              PROTECT
            </span>
            <span
              className="block text-5xl md:text-7xl lg:text-8xl tracking-tight bat-gold-text"
            >
              SOLANA
            </span>
            <span
              className="block text-5xl md:text-7xl lg:text-8xl tracking-tight"
              style={{ color: 'var(--bat-text-bright)' }}
            >
              FROM CRIME
            </span>
          </h1>

          <p
            className="font-body text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed"
            style={{ color: 'var(--bat-text-dim)', fontWeight: 500 }}
          >
            Real-time Anti-Money Laundering compliance platform for Solana protocols.
            On-chain enforcement via Transfer Hook. Zero manual review.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="bat-btn bat-btn-primary px-8 py-4 rounded text-base flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              className="bat-btn bat-btn-ghost px-8 py-4 rounded text-base flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Terminal className="w-5 h-5" />
              View Source
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="bat-card corner-bracket p-5 rounded"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="font-display text-2xl md:text-3xl font-bold mb-1"
                  style={{ color: 'var(--bat-gold)' }}
                >
                  {stat.value}
                </div>
                <div className="font-body font-semibold text-sm" style={{ color: 'var(--bat-text-bright)' }}>
                  {stat.label}
                </div>
                <div className="font-body text-xs mt-0.5" style={{ color: 'var(--bat-text-dim)' }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(transparent, var(--bat-black))' }}
        />
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-block font-body font-semibold text-xs tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full border"
              style={{ color: 'var(--bat-gold)', borderColor: 'rgba(245,197,24,0.2)', background: 'rgba(245,197,24,0.05)' }}
            >
              Capabilities
            </div>
            <h2
              className="font-display text-4xl md:text-5xl font-bold mb-4"
              style={{ color: 'var(--bat-text-bright)' }}
            >
              ENTERPRISE-GRADE
              <br />
              <span style={{ color: 'var(--bat-gold)' }}>AML INTELLIGENCE</span>
            </h2>
            <p className="font-body text-lg max-w-2xl mx-auto" style={{ color: 'var(--bat-text-dim)', fontWeight: 500 }}>
              Built specifically for Solana. Faster, cheaper, and more powerful than legacy compliance tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="bat-card bat-scan rounded-lg p-6 group cursor-default"
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center mb-4 transition-all duration-300"
                  style={{
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                  }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3
                  className="font-display text-sm font-bold tracking-wider mb-3"
                  style={{ color: feature.color }}
                >
                  {feature.title}
                </h3>
                <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--bat-text-dim)', fontWeight: 500 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="architecture" className="py-24 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(245,197,24,0.03) 0%, transparent 70%)' }}
        />
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-block font-body font-semibold text-xs tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full border"
              style={{ color: 'var(--bat-gold)', borderColor: 'rgba(245,197,24,0.2)', background: 'rgba(245,197,24,0.05)' }}
            >
              System Flow
            </div>
            <h2 className="font-display text-4xl font-bold" style={{ color: 'var(--bat-text-bright)' }}>
              HOW IT <span style={{ color: 'var(--bat-gold)' }}>WORKS</span>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {[
              { step: '01', title: 'Transaction Occurs', desc: 'Solana network processes transfer', color: 'var(--bat-blue)' },
              { step: '02', title: 'Indexer Captures', desc: 'Real-time RPC monitoring', color: 'var(--bat-gold)' },
              { step: '03', title: 'Risk Analysis', desc: 'ML scoring + pattern detection', color: '#a855f7' },
              { step: '04', title: 'Decision Made', desc: 'Allow, flag, or block on-chain', color: '#00ff88' },
              { step: '05', title: 'Alert Issued', desc: 'Dashboard + WebSocket notify', color: 'var(--bat-red)' },
            ].map((item, i) => (
              <div key={i} className="flex md:flex-col items-center gap-4 md:gap-2 flex-1">
                <div
                  className="bat-card rounded-lg p-4 text-center w-full corner-bracket"
                  style={{ borderColor: `${item.color}30` }}
                >
                  <div
                    className="font-display text-xs font-bold tracking-widest mb-2"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </div>
                  <div className="font-display text-xs font-bold mb-1" style={{ color: 'var(--bat-text-bright)' }}>
                    {item.title}
                  </div>
                  <div className="font-body text-xs" style={{ color: 'var(--bat-text-dim)' }}>
                    {item.desc}
                  </div>
                </div>
                {i < 4 && (
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 md:rotate-90 md:mx-auto"
                    style={{ color: 'var(--bat-text-dim)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-block font-body font-semibold text-xs tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full border"
              style={{ color: 'var(--bat-gold)', borderColor: 'rgba(245,197,24,0.2)', background: 'rgba(245,197,24,0.05)' }}
            >
              Pricing
            </div>
            <h2 className="font-display text-4xl font-bold" style={{ color: 'var(--bat-text-bright)' }}>
              SIMPLE <span style={{ color: 'var(--bat-gold)' }}>PRICING</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'STARTER', price: '$500', period: '/month', features: ['10K transactions/mo', 'Basic risk scoring', 'Email alerts', 'REST API access'], highlight: false },
              { name: 'PROFESSIONAL', price: '$2,000', period: '/month', features: ['100K transactions/mo', 'ML pattern detection', 'WebSocket + Telegram', 'On-chain blacklist', 'Network graph'], highlight: true },
              { name: 'ENTERPRISE', price: 'Custom', period: '', features: ['Unlimited transactions', 'Custom ML models', 'White-label solution', 'SLA guarantee', 'Dedicated support'], highlight: false },
            ].map((plan, i) => (
              <div
                key={i}
                className="bat-card rounded-lg p-6 relative"
                style={{
                  borderColor: plan.highlight ? 'rgba(245,197,24,0.4)' : 'var(--bat-border)',
                  boxShadow: plan.highlight ? '0 0 30px var(--bat-gold-glow), inset 0 0 30px rgba(245,197,24,0.03)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-display font-bold tracking-widest"
                    style={{ background: 'var(--bat-gold)', color: 'var(--bat-black)' }}
                  >
                    POPULAR
                  </div>
                )}
                <h3
                  className="font-display text-sm font-bold tracking-widest mb-4"
                  style={{ color: plan.highlight ? 'var(--bat-gold)' : 'var(--bat-text-dim)' }}
                >
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="font-display text-4xl font-black" style={{ color: 'var(--bat-text-bright)' }}>
                    {plan.price}
                  </span>
                  <span className="font-body text-sm" style={{ color: 'var(--bat-text-dim)' }}>{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 font-body text-sm font-semibold" style={{ color: 'var(--bat-text)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: plan.highlight ? 'var(--bat-gold)' : 'var(--bat-text-dim)', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`bat-btn w-full py-3 rounded text-sm text-center block ${plan.highlight ? 'bat-btn-primary' : 'bat-btn-ghost'}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(245,197,24,0.05) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="font-display text-4xl md:text-6xl font-black mb-6 leading-none">
            <span style={{ color: 'var(--bat-text-bright)' }}>MAKE SOLANA</span>
            <br />
            <span style={{ color: 'var(--bat-gold)' }}>SAFER TODAY</span>
          </h2>
          <p className="font-body text-lg mb-10" style={{ color: 'var(--bat-text-dim)', fontWeight: 500 }}>
            Join protocols already protecting their users with real-time AML compliance.
          </p>
          <Link
            href="/signup"
            className="bat-btn bat-btn-primary px-10 py-4 rounded text-base inline-flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 border-t"
        style={{ borderColor: 'var(--bat-border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: 'var(--bat-gold)' }} />
            <span className="font-display text-sm font-bold tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>
              SOLANA AML SUITE
            </span>
          </div>
          <p className="font-body text-sm" style={{ color: 'var(--bat-text-dim)' }}>
            Built for Solana Bounty 2025 · Nepal 🇳🇵
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="font-body text-sm font-semibold transition-colors" style={{ color: 'var(--bat-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}>
              Login
            </Link>
            <Link href="/signup" className="font-body text-sm font-semibold transition-colors" style={{ color: 'var(--bat-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}>
              Sign Up
            </Link>
            <a href="https://github.com" target="_blank" className="font-body text-sm font-semibold transition-colors" style={{ color: 'var(--bat-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
