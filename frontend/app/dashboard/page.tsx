'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Search, TrendingUp, Users, Flag, LogOut,
  Activity, Bell, RefreshCw, AlertTriangle, Eye,
  Terminal, ChevronRight, Zap, Globe,
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function RiskBadge({ score }: { score: number }) {
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const styles = {
    high: { color: '#ff3333', bg: 'rgba(255,51,51,0.1)', border: 'rgba(255,51,51,0.3)' },
    medium: { color: '#f5c518', bg: 'rgba(245,197,24,0.1)', border: 'rgba(245,197,24,0.3)' },
    low: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
  };
  const s = styles[level];
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-display font-bold tracking-wider border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {score} {level.toUpperCase()}
    </span>
  );
}

const NAV_ITEMS = [
  { id: 'overview', label: 'OVERVIEW', icon: Activity },
  { id: 'transactions', label: 'TRANSACTIONS', icon: TrendingUp },
  { id: 'alerts', label: 'ALERTS', icon: Bell },
  { id: 'blacklist', label: 'BLACKLIST', icon: Flag },
  { id: 'network', label: 'NETWORK', icon: Globe },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (userData) setUser(JSON.parse(userData));

    fetchAll();

    const ws = new WebSocket('ws://localhost:3001');
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_transactions') setTransactions(p => [...data.data, ...p].slice(0, 50));
      if (data.type === 'pattern_detected' || data.type === 'blacklist_added') { fetchAlerts(); fetchStats(); }
    };

    setMounted(true);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => { ws.close(); clearInterval(clock); };
  }, [router]);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });
  const fetchAll = () => { fetchStats(); fetchTransactions(); fetchAlerts(); fetchBlacklist(); };
  const fetchStats = async () => { try { const r = await axios.get(`${API_URL}/api/stats`, { headers: headers() }); setStats(r.data); } catch {} };
  const fetchTransactions = async () => { try { const r = await axios.get(`${API_URL}/api/transactions?limit=50`, { headers: headers() }); setTransactions(r.data.transactions || []); } catch {} };
  const fetchAlerts = async () => { try { const r = await axios.get(`${API_URL}/api/alerts?limit=30`, { headers: headers() }); setAlerts(r.data.alerts || []); } catch {} };
  const fetchBlacklist = async () => { try { const r = await axios.get(`${API_URL}/api/blacklist`, { headers: headers() }); setBlacklist(r.data.blacklist || []); } catch {} };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true); setSearchResult(null);
    try {
      const r = await axios.get(`${API_URL}/api/wallet/${searchQuery.trim()}/risk`, { headers: headers() });
      setSearchResult(r.data);
    } catch { setSearchResult({ error: 'Wallet not found' }); }
    finally { setSearchLoading(false); }
  };

  const handleAddBlacklist = async () => {
    if (!blacklistAddress || !blacklistReason) return;
    setBlacklistLoading(true);
    try {
      await axios.post(`${API_URL}/api/blacklist`, { address: blacklistAddress, reason: blacklistReason }, { headers: headers() });
      setBlacklistAddress(''); setBlacklistReason('');
      fetchBlacklist(); fetchStats();
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
    finally { setBlacklistLoading(false); }
  };

  const handleRemoveBlacklist = async (address: string) => {
    try { await axios.delete(`${API_URL}/api/blacklist/${address}`, { headers: headers() }); fetchBlacklist(); fetchStats(); } catch {}
  };

  const handleLogout = () => { localStorage.removeItem('authToken'); localStorage.removeItem('user'); router.push('/login'); };

  const statCards = [
    { label: 'TRANSACTIONS', value: Number(stats?.stats?.total_transactions || 0).toLocaleString(), icon: TrendingUp, color: '#00d4ff', glow: 'rgba(0,212,255,0.2)' },
    { label: 'WALLETS TRACKED', value: Number(stats?.stats?.total_wallets || 0).toLocaleString(), icon: Users, color: '#f5c518', glow: 'rgba(245,197,24,0.2)' },
    { label: 'BLACKLISTED', value: Number(stats?.stats?.blacklisted_wallets || 0).toLocaleString(), icon: Flag, color: '#ff3333', glow: 'rgba(255,51,51,0.2)' },
    { label: 'ACTIVE ALERTS', value: Number(stats?.stats?.unread_alerts || 0).toLocaleString(), icon: AlertTriangle, color: '#ff8800', glow: 'rgba(255,136,0,0.2)' },
  ];

  const pieData = (stats?.risk_distribution || []).map((d: any) => ({
    name: d.risk_level, value: Number(d.count),
    color: d.risk_level === 'high' ? '#ff3333' : d.risk_level === 'medium' ? '#f5c518' : '#00ff88',
  }));

  const activityData = (stats?.recent_activity || []).slice(0, 12).reverse().map((d: any) => ({
    time: new Date(d.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: Number(d.count),
  }));

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bat-black)', fontFamily: 'Rajdhani, sans-serif' }}>

      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col border-r transition-all duration-300"
        style={{
          width: sidebarOpen ? '240px' : '64px',
          background: 'var(--bat-dark)',
          borderColor: 'rgba(245,197,24,0.1)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'rgba(245,197,24,0.1)' }}
        >
          <div
            className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bat-gold)', boxShadow: '0 0 15px var(--bat-gold-glow-strong)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--bat-black)' }} />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-display text-sm font-black tracking-widest" style={{ color: 'var(--bat-gold)' }}>AML SUITE</div>
              <div className="font-body text-xs" style={{ color: 'var(--bat-text-dim)' }}>WAYNE ENTERPRISES</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => item.id === 'network' ? router.push('/network') : setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded transition-all duration-200 bat-glitch"
                style={{
                  background: active ? 'rgba(245,197,24,0.1)' : 'transparent',
                  borderLeft: active ? '2px solid var(--bat-gold)' : '2px solid transparent',
                  color: active ? 'var(--bat-gold)' : 'var(--bat-text-dim)',
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-display text-xs font-bold tracking-wider">{item.label}</span>
                )}
                {item.id === 'alerts' && unreadCount > 0 && sidebarOpen && (
                  <span
                    className="ml-auto text-xs font-display font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bat-red)', color: 'white', fontSize: '10px' }}
                  >{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(245,197,24,0.1)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded transition-all"
            style={{ color: 'var(--bat-text-dim)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff3333'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,51,51,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--bat-text-dim)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="font-display text-xs font-bold tracking-wider">LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--bat-dark)', borderColor: 'rgba(245,197,24,0.1)' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--bat-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Search */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded border"
              style={{ background: 'rgba(10,10,20,0.8)', borderColor: 'rgba(245,197,24,0.15)', width: '320px' }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--bat-text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="SCAN WALLET ADDRESS..."
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: 'var(--bat-text-bright)', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}
              />
              {searchLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--bat-gold)' }} />
                : <button onClick={handleSearch} style={{ color: 'var(--bat-gold)' }}><ChevronRight className="w-4 h-4" /></button>
              }
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Clock */}
            <div className="hidden md:block text-right">
              <div className="font-display text-xs font-bold" style={{ color: 'var(--bat-gold)', fontFamily: 'Share Tech Mono, monospace' }}>
                {mounted ? time.toLocaleTimeString() : '--:--:--'}
              </div>
              <div className="font-body text-xs" style={{ color: 'var(--bat-text-dim)' }}>
                {mounted ? time.toLocaleDateString() : '--/--/----'}
              </div>
            </div>

            {/* WS status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'live-dot' : ''}`}
                style={{ background: wsStatus === 'connected' ? '#00ff88' : wsStatus === 'connecting' ? '#f5c518' : '#ff3333' }}
              />
              <span className="font-display text-xs font-bold tracking-wider hidden md:block" style={{ color: 'var(--bat-text-dim)' }}>
                {wsStatus.toUpperCase()}
              </span>
            </div>

            <button onClick={fetchAll} style={{ color: 'var(--bat-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}>
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User */}
            {user && (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center font-display text-sm font-black"
                  style={{ background: 'var(--bat-gold)', color: 'var(--bat-black)' }}
                >
                  {user.userName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <div className="font-display text-xs font-bold tracking-wider" style={{ color: 'var(--bat-text-bright)' }}>
                    {user.userName?.toUpperCase()}
                  </div>
                  <div className="font-body text-xs" style={{ color: 'var(--bat-text-dim)' }}>{user.role || 'ANALYST'}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page title bar */}
        <div
          className="flex items-center gap-3 px-6 py-3 border-b"
          style={{ borderColor: 'rgba(245,197,24,0.05)', background: 'rgba(10,10,15,0.5)' }}
        >
          <div className="w-1 h-5 rounded" style={{ background: 'var(--bat-gold)' }} />
          <h1 className="font-display text-sm font-black tracking-[0.2em]" style={{ color: 'var(--bat-text-bright)' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'OVERVIEW'}
          </h1>
          <span style={{ color: 'var(--bat-text-dim)' }}>/</span>
          <span className="font-body text-sm" style={{ color: 'var(--bat-text-dim)' }}>
            SOLANA AML COMPLIANCE SUITE
          </span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6" style={{ background: 'var(--bat-black)' }}>

          {/* Search result */}
          {searchResult && (
            <div
              className="mb-6 p-5 rounded border bat-card"
              style={{ borderColor: searchResult.error ? 'rgba(255,51,51,0.3)' : 'rgba(245,197,24,0.2)' }}
            >
              {searchResult.error ? (
                <p style={{ color: '#ff3333' }} className="font-body font-semibold">{searchResult.error}</p>
              ) : (
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-display text-xs tracking-widest mb-1" style={{ color: 'var(--bat-text-dim)' }}>WALLET ADDRESS</p>
                    <p className="font-mono text-sm break-all" style={{ color: 'var(--bat-text-bright)', fontFamily: 'Share Tech Mono, monospace' }}>{searchResult.address}</p>
                    <div className="flex flex-wrap gap-6 mt-3">
                      {[
                        { label: 'TRANSACTIONS', val: searchResult.total_transactions },
                        { label: 'VOLUME (SOL)', val: Number(searchResult.total_volume_sol).toFixed(4) },
                        { label: 'STATUS', val: searchResult.is_blacklisted ? '🚫 BLACKLISTED' : '✅ CLEAN', color: searchResult.is_blacklisted ? '#ff3333' : '#00ff88' },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>{item.label}</p>
                          <p className="font-display text-sm font-bold" style={{ color: item.color || 'var(--bat-text-bright)' }}>{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-xs tracking-widest mb-2" style={{ color: 'var(--bat-text-dim)' }}>RISK SCORE</p>
                    <RiskBadge score={searchResult.risk_score} />
                  </div>
                </div>
              )}
              <button onClick={() => setSearchResult(null)} className="mt-3 font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>
                [ DISMISS ]
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                  <div key={i} className="bat-card corner-bracket rounded p-5 bat-scan">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-display text-xs font-bold tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>{card.label}</p>
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center"
                        style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}
                      >
                        <card.icon className="w-4 h-4" style={{ color: card.color }} />
                      </div>
                    </div>
                    <p className="font-display text-3xl font-black" style={{ color: card.color, textShadow: `0 0 20px ${card.glow}` }}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bat-card rounded p-5">
                  <p className="font-display text-xs font-bold tracking-[0.2em] mb-4" style={{ color: 'var(--bat-gold)' }}>
                    ▸ TRANSACTION ACTIVITY · 24H
                  </p>
                  {activityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(245,197,24,0.05)" />
                        <XAxis dataKey="time" stroke="rgba(245,197,24,0.2)" tick={{ fill: '#5a5a7a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                        <YAxis stroke="rgba(245,197,24,0.2)" tick={{ fill: '#5a5a7a', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                        <Tooltip
                          contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 4, fontFamily: 'Rajdhani' }}
                          labelStyle={{ color: '#f5c518' }}
                          itemStyle={{ color: '#c8c8d4' }}
                        />
                        <Bar dataKey="count" fill="#f5c518" radius={[2, 2, 0, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center">
                      <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>
                        AWAITING DATA — INDEXER COLLECTING...
                      </p>
                    </div>
                  )}
                </div>

                <div className="bat-card rounded p-5">
                  <p className="font-display text-xs font-bold tracking-[0.2em] mb-4" style={{ color: 'var(--bat-gold)' }}>
                    ▸ RISK DISTRIBUTION
                  </p>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                            {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 4, fontFamily: 'Rajdhani' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 mt-2">
                        {pieData.map((d: any) => (
                          <div key={d.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                              <span className="font-display text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--bat-text-dim)' }}>{d.name}</span>
                            </div>
                            <span className="font-display text-xs font-bold" style={{ color: d.color }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center">
                      <p className="font-display text-xs tracking-widest text-center" style={{ color: 'var(--bat-text-dim)' }}>
                        NO WALLET DATA YET
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent alerts */}
              <div className="bat-card rounded p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--bat-gold)' }}>
                    ▸ RECENT ALERTS
                  </p>
                  <button onClick={() => setActiveTab('alerts')} className="font-display text-xs tracking-wider transition-colors" style={{ color: 'var(--bat-text-dim)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}>
                    VIEW ALL →
                  </button>
                </div>
                {alerts.length === 0 ? (
                  <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>
                    SYSTEM NOMINAL — NO ALERTS DETECTED
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((alert: any, i: number) => (
                      <div key={i} className="bat-table-row flex items-center gap-4 py-3 px-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!alert.is_read ? 'live-dot' : ''}`}
                          style={{ background: alert.severity === 'high' || alert.severity === 'critical' ? '#ff3333' : alert.severity === 'medium' ? '#f5c518' : '#00d4ff' }} />
                        <span className={`px-2 py-0.5 rounded text-xs font-display font-bold tracking-wider border flex-shrink-0 severity-${alert.severity}`}>
                          {(alert.severity || 'low').toUpperCase()}
                        </span>
                        <p className="font-body text-sm flex-1 truncate" style={{ color: 'var(--bat-text)', fontWeight: 600 }}>{alert.message}</p>
                        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--bat-text-dim)', fontFamily: 'Share Tech Mono, monospace' }}>
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="bat-card rounded overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(245,197,24,0.1)' }}>
                <p className="font-display text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--bat-gold)' }}>
                  ▸ LIVE TRANSACTION FEED
                </p>
                <span className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>
                  {transactions.length} RECORDS
                </span>
              </div>
              {transactions.length === 0 ? (
                <div className="p-16 text-center">
                  <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--bat-text-dim)' }} />
                  <p className="font-display text-xs tracking-[0.2em]" style={{ color: 'var(--bat-text-dim)' }}>
                    AWAITING TRANSACTIONS — ENSURE INDEXER IS RUNNING
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(245,197,24,0.1)' }}>
                        {['FROM', 'TO', 'AMOUNT (SOL)', 'RISK', 'TIME', 'STATUS'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-display text-xs font-bold tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx: any, i: number) => (
                        <tr key={i} className="bat-table-row" style={{ background: tx.is_flagged ? 'rgba(255,51,51,0.03)' : 'transparent' }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--bat-text)', fontFamily: 'Share Tech Mono, monospace' }}>
                            {tx.from_address?.slice(0, 8)}...{tx.from_address?.slice(-4)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--bat-text)', fontFamily: 'Share Tech Mono, monospace' }}>
                            {tx.to_address?.slice(0, 8)}...{tx.to_address?.slice(-4)}
                          </td>
                          <td className="px-4 py-3 font-display text-sm font-bold" style={{ color: 'var(--bat-text-bright)' }}>
                            {Number(tx.amount).toFixed(4)}
                          </td>
                          <td className="px-4 py-3"><RiskBadge score={tx.risk_score || 0} /></td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--bat-text-dim)', fontFamily: 'Share Tech Mono, monospace' }}>
                            {new Date(tx.block_time).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            {tx.is_flagged
                              ? <span className="font-display text-xs font-bold tracking-wider px-2 py-0.5 rounded border severity-high">🚨 FLAGGED</span>
                              : <span className="font-display text-xs font-bold tracking-wider px-2 py-0.5 rounded border" style={{ color: '#00ff88', borderColor: 'rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.08)' }}>✓ CLEAN</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ALERTS */}
          {activeTab === 'alerts' && (
            <div className="bat-card rounded overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(245,197,24,0.1)' }}>
                <p className="font-display text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--bat-gold)' }}>▸ ALERT SYSTEM</p>
                <span className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>{alerts.length} TOTAL</span>
              </div>
              {alerts.length === 0 ? (
                <div className="p-16 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--bat-text-dim)' }} />
                  <p className="font-display text-xs tracking-[0.2em]" style={{ color: 'var(--bat-text-dim)' }}>
                    SYSTEM NOMINAL — NO THREATS DETECTED
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(245,197,24,0.05)' }}>
                  {alerts.map((alert: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-5 transition-colors"
                      style={{ background: !alert.is_read ? 'rgba(245,197,24,0.02)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,197,24,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = !alert.is_read ? 'rgba(245,197,24,0.02)' : 'transparent')}>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${!alert.is_read ? 'live-dot' : ''}`}
                        style={{ background: alert.severity === 'critical' ? '#ff0000' : alert.severity === 'high' ? '#ff3333' : alert.severity === 'medium' ? '#f5c518' : '#00d4ff' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs font-bold tracking-wider mb-1" style={{ color: 'var(--bat-text-bright)' }}>
                          {(alert.alert_type || '').replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="font-body text-sm" style={{ color: 'var(--bat-text)', fontWeight: 600 }}>{alert.message}</p>
                        {alert.wallet_address && (
                          <p className="font-mono text-xs mt-1" style={{ color: 'var(--bat-text-dim)', fontFamily: 'Share Tech Mono, monospace' }}>{alert.wallet_address}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-display font-bold tracking-wider px-2 py-0.5 rounded border severity-${alert.severity}`}>
                          {(alert.severity || 'low').toUpperCase()}
                        </span>
                        <p className="font-mono text-xs mt-1" style={{ color: 'var(--bat-text-dim)', fontFamily: 'Share Tech Mono, monospace' }}>
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BLACKLIST */}
          {activeTab === 'blacklist' && (
            <div className="space-y-6">
              <div className="bat-card rounded p-5">
                <p className="font-display text-xs font-bold tracking-[0.2em] mb-4" style={{ color: 'var(--bat-gold)' }}>
                  ▸ ADD TO BLACKLIST
                </p>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={blacklistAddress}
                    onChange={e => setBlacklistAddress(e.target.value)}
                    placeholder="WALLET ADDRESS"
                    className="bat-input flex-1 px-4 py-2.5 rounded"
                    style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}
                  />
                  <input
                    type="text"
                    value={blacklistReason}
                    onChange={e => setBlacklistReason(e.target.value)}
                    placeholder="REASON FOR BLACKLISTING"
                    className="bat-input flex-1 px-4 py-2.5 rounded"
                  />
                  <button
                    onClick={handleAddBlacklist}
                    disabled={blacklistLoading || !blacklistAddress || !blacklistReason}
                    className="bat-btn bat-btn-danger px-6 py-2.5 rounded flex-shrink-0"
                  >
                    {blacklistLoading ? 'PROCESSING...' : '🚫 BLACKLIST'}
                  </button>
                </div>
              </div>

              <div className="bat-card rounded overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(245,197,24,0.1)' }}>
                  <p className="font-display text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--bat-gold)' }}>
                    ▸ BLACKLISTED ADDRESSES
                  </p>
                  <span className="font-display text-xs tracking-wider" style={{ color: 'var(--bat-text-dim)' }}>{blacklist.length} ENTRIES</span>
                </div>
                {blacklist.length === 0 ? (
                  <div className="p-16 text-center">
                    <Flag className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--bat-text-dim)' }} />
                    <p className="font-display text-xs tracking-[0.2em]" style={{ color: 'var(--bat-text-dim)' }}>
                      NO BLACKLISTED ADDRESSES ON RECORD
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'rgba(245,197,24,0.05)' }}>
                    {blacklist.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bat-table-row">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm truncate" style={{ color: 'var(--bat-text-bright)', fontFamily: 'Share Tech Mono, monospace' }}>{entry.address}</p>
                          <p className="font-body text-xs mt-0.5" style={{ color: 'var(--bat-text-dim)', fontWeight: 600 }}>{entry.reason}</p>
                        </div>
                        <span className="font-display text-xs font-bold tracking-wider flex-shrink-0" style={{ color: 'var(--bat-text-dim)' }}>
                          {(entry.source || '').toUpperCase()}
                        </span>
                        <span className={`text-xs font-display font-bold tracking-wider px-2 py-0.5 rounded border flex-shrink-0 severity-${entry.severity === 'critical' ? 'critical' : 'high'}`}>
                          {(entry.severity || 'high').toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleRemoveBlacklist(entry.address)}
                          className="bat-btn bat-btn-ghost px-3 py-1.5 rounded text-xs flex-shrink-0"
                          style={{ color: 'var(--bat-text-dim)', borderColor: 'rgba(255,51,51,0.2)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff3333'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,51,51,0.5)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--bat-text-dim)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,51,51,0.2)'; }}
                        >
                          REMOVE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
