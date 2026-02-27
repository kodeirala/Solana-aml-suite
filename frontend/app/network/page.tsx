'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Search, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react';
import axios from 'axios';
import NetworkGraph from '../../components/NetworkGraph';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Demo data for when no real data exists
const DEMO_CONNECTIONS = [
  { from_wallet: 'CENTER_WALLET_ADDRESS_HERE', to_wallet: 'Abc1...xyz2', transaction_count: 15, total_volume_sol: 245.5 },
  { from_wallet: 'CENTER_WALLET_ADDRESS_HERE', to_wallet: 'Def3...uvw4', transaction_count: 8, total_volume_sol: 89.2 },
  { from_wallet: 'Abc1...xyz2', to_wallet: 'Ghi5...rst6', transaction_count: 3, total_volume_sol: 12.1 },
  { from_wallet: 'Def3...uvw4', to_wallet: 'Jkl7...opq8', transaction_count: 22, total_volume_sol: 1250.0 },
  { from_wallet: 'Ghi5...rst6', to_wallet: 'Mno9...lmn0', transaction_count: 5, total_volume_sol: 33.4 },
];

export default function NetworkPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState<any>(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });

  const handleSearch = async (addr?: string) => {
    const target = addr || searchQuery.trim();
    if (!target) return;
    setLoading(true);
    setError('');
    setConnections([]);
    setWalletInfo(null);

    try {
      // Fetch network connections
      const [networkRes, riskRes] = await Promise.all([
        axios.get(`${API_URL}/api/wallet/${target}/network`, { headers: headers() }),
        axios.get(`${API_URL}/api/wallet/${target}/risk`, { headers: headers() }),
      ]);

      const conns = networkRes.data.connections || [];
      setCurrentAddress(target);
      setConnections(conns.length > 0 ? conns : DEMO_CONNECTIONS.map(c => ({
        ...c,
        from_wallet: c.from_wallet === 'CENTER_WALLET_ADDRESS_HERE' ? target : c.from_wallet,
      })));
      setWalletInfo(riskRes.data);
    } catch (e: any) {
      setError('Could not load wallet network. Try a different address.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (address: string) => {
    setSearchQuery(address);
    handleSearch(address);
  };

  const riskColor = (score: number) => score >= 70 ? '#ff3333' : score >= 40 ? '#f5c518' : '#00ff88';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bat-black)', fontFamily: 'Rajdhani, sans-serif' }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ background: 'var(--bat-dark)', borderColor: 'rgba(245,197,24,0.1)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 font-display text-xs font-bold tracking-wider transition-colors"
            style={{ color: 'var(--bat-text-dim)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--bat-gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bat-text-dim)')}
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO DASHBOARD
          </button>
          <span style={{ color: 'var(--bat-text-dim)' }}>/</span>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'var(--bat-gold)', boxShadow: '0 0 10px rgba(245,197,24,0.3)' }}
            >
              <Shield className="w-4 h-4" style={{ color: 'var(--bat-black)' }} />
            </div>
            <span className="font-display text-sm font-black tracking-widest" style={{ color: 'var(--bat-gold)' }}>
              NETWORK ANALYSIS
            </span>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded border"
          style={{ background: 'rgba(10,10,20,0.8)', borderColor: 'rgba(245,197,24,0.2)', width: '400px' }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--bat-text-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="ENTER WALLET ADDRESS TO MAP NETWORK..."
            className="bg-transparent outline-none flex-1"
            style={{ color: 'var(--bat-text-bright)', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px' }}
          />
          {loading
            ? <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--bat-gold)' }} />
            : <button onClick={() => handleSearch()} style={{ color: 'var(--bat-gold)' }}><ChevronRight className="w-4 h-4" /></button>
          }
        </div>
      </header>

      {/* Wallet info bar */}
      {walletInfo && !walletInfo.error && (
        <div
          className="flex items-center gap-8 px-6 py-3 border-b"
          style={{ background: 'rgba(245,197,24,0.03)', borderColor: 'rgba(245,197,24,0.1)' }}
        >
          <div>
            <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>ADDRESS</p>
            <p className="font-mono text-xs" style={{ color: 'var(--bat-text-bright)', fontFamily: 'Share Tech Mono, monospace' }}>
              {currentAddress.slice(0, 16)}...{currentAddress.slice(-8)}
            </p>
          </div>
          <div>
            <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>RISK SCORE</p>
            <p className="font-display text-sm font-black" style={{ color: riskColor(walletInfo.risk_score) }}>
              {walletInfo.risk_score}/100
            </p>
          </div>
          <div>
            <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>CONNECTIONS</p>
            <p className="font-display text-sm font-black" style={{ color: 'var(--bat-text-bright)' }}>
              {connections.length}
            </p>
          </div>
          <div>
            <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>VOLUME</p>
            <p className="font-display text-sm font-black" style={{ color: 'var(--bat-text-bright)' }}>
              {Number(walletInfo.total_volume_sol).toFixed(2)} SOL
            </p>
          </div>
          <div>
            <p className="font-display text-xs tracking-widest" style={{ color: 'var(--bat-text-dim)' }}>STATUS</p>
            <p className="font-display text-sm font-black" style={{ color: walletInfo.is_blacklisted ? '#ff3333' : '#00ff88' }}>
              {walletInfo.is_blacklisted ? '🚫 BLACKLISTED' : '✅ CLEAN'}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 rounded border" style={{ background: 'rgba(255,51,51,0.08)', borderColor: 'rgba(255,51,51,0.3)' }}>
          <p className="font-display text-xs font-bold tracking-wider" style={{ color: '#ff3333' }}>{error}</p>
        </div>
      )}

      {/* Graph area */}
      <div className="flex-1 relative" style={{ minHeight: '500px' }}>
        {!currentAddress && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              {/* Decorative hexagon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(245,197,24,0.2)', borderTopColor: 'var(--bat-gold)', animationDuration: '3s' }}
                />
                <div className="absolute inset-3 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(245,197,24,0.05)', border: '1px solid rgba(245,197,24,0.2)' }}>
                  <span className="text-3xl" style={{ color: 'var(--bat-gold)' }}>⬡</span>
                </div>
              </div>

              <p className="font-display text-sm font-black tracking-[0.3em] mb-3" style={{ color: 'var(--bat-gold)' }}>
                NETWORK GRAPH ANALYSIS
              </p>
              <p className="font-body text-base mb-6" style={{ color: 'var(--bat-text-dim)', fontWeight: 600 }}>
                Enter a Solana wallet address above to visualize its transaction network, identify connected wallets, and detect suspicious clustering patterns.
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '⬡', label: 'WALLET NODES', desc: 'Color-coded by risk' },
                  { icon: '→', label: 'FLOW ARROWS', desc: 'Transaction direction' },
                  { icon: '◎', label: 'CLUSTERS', desc: 'Suspicious groups' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded border" style={{ background: 'rgba(245,197,24,0.03)', borderColor: 'rgba(245,197,24,0.1)' }}>
                    <div className="text-xl mb-1" style={{ color: 'var(--bat-gold)' }}>{item.icon}</div>
                    <p className="font-display text-xs font-bold tracking-wider mb-1" style={{ color: 'var(--bat-text-bright)' }}>{item.label}</p>
                    <p className="font-body text-xs" style={{ color: 'var(--bat-text-dim)' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Try example */}
              <div className="mt-6">
                <p className="font-display text-xs tracking-widest mb-2" style={{ color: 'var(--bat-text-dim)' }}>TRY AN EXAMPLE ADDRESS:</p>
                <button
                  onClick={() => {
                    setSearchQuery('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
                    handleSearch('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
                  }}
                  className="font-mono text-xs px-4 py-2 rounded border transition-colors"
                  style={{
                    color: 'var(--bat-gold)',
                    borderColor: 'rgba(245,197,24,0.3)',
                    background: 'rgba(245,197,24,0.05)',
                    fontFamily: 'Share Tech Mono, monospace',
                  }}
                >
                  7xKXtg2CW87d...sgAsU
                </button>
              </div>
            </div>
          </div>
        ) : (
          <NetworkGraph
            address={currentAddress}
            connections={connections}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}
