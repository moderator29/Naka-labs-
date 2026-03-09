'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Dna, Search, AlertTriangle, CheckCircle, TrendingUp, Clock, Activity } from 'lucide-react';
import { formatUSD, formatPercent, formatAddress, formatTimeAgo } from '@/lib/utils/formatters';

interface DNAResult {
  walletAddress: string;
  chain: string;
  profileType: string;
  riskScore: number;
  winRate: number;
  avgHoldTime: number;
  totalTrades: number;
  totalVolume: number;
  firstSeen: string;
  lastActive: string;
  topTokens: { symbol: string; profit: number; trades: number }[];
  redFlags: string[];
  tradingStyle: string;
  topChains: string[];
  pnl30d: number;
  pnl90d: number;
}

const PROFILE_COLORS: Record<string, string> = {
  Whale: '#FFD23F',
  'Smart Money': '#00E5FF',
  Degen: '#FF6B35',
  Holder: '#8C8DFC',
  'Market Maker': '#0A1EFF',
  Sniper: '#FF0420',
};

export default function DNAAnalyzerPage() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ETHEREUM');
  const [analysis, setAnalysis] = useState<DNAResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!address.trim()) {
      toast.error('Enter a wallet address');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Analyzing wallet DNA...');

    try {
      const res = await fetch('/api/dna/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), chain }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.isContract) {
          toast.error('Contract detected! Redirecting to Scanner...', { id: toastId });
          setTimeout(() => router.push(`/scanner?address=${address.trim()}`), 2000);
          return;
        }
        toast.error(data.error, { id: toastId });
        return;
      }

      setAnalysis(data.analysis);
      toast.success('DNA analysis complete!', { id: toastId });
    } catch {
      toast.error('Analysis failed. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const profileColor = analysis ? (PROFILE_COLORS[analysis.profileType] ?? '#8B91A0') : '#8B91A0';

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <Dna size={32} className="text-neon-blue" />
            Wallet DNA Analyzer
          </h1>
          <p className="text-text-secondary">
            Deep behavioral analysis of any wallet address. Wallets only — contracts redirect to Scanner.
          </p>
        </div>

        {/* Input */}
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-neon-blue sm:w-36 flex-shrink-0"
            >
              <option value="ETHEREUM">Ethereum</option>
              <option value="SOLANA">Solana</option>
              <option value="BASE">Base</option>
              <option value="ARBITRUM">Arbitrum</option>
              <option value="POLYGON">Polygon</option>
              <option value="BSC">BSC</option>
            </select>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Enter wallet address (0x... or Solana base58)"
                className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-neon-blue"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-neon-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all active:scale-95 flex-shrink-0"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Overview */}
            <div className="bg-bg-secondary border rounded-2xl p-6" style={{ borderColor: `${profileColor}40` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-text-tertiary mb-1">Wallet Profile</div>
                  <h2 className="text-3xl font-black mb-2" style={{ color: profileColor }}>
                    {analysis.profileType}
                  </h2>
                  <div className="text-sm text-text-secondary">
                    {formatAddress(analysis.walletAddress, 10)} · {analysis.chain}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black"
                    style={{ borderColor: profileColor, color: profileColor }}
                  >
                    {analysis.riskScore}
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">Risk Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Stat label="Win Rate" value={formatPercent(analysis.winRate, false)} icon={<TrendingUp size={14} />} color="#00E5FF" />
                <Stat label="Total Trades" value={analysis.totalTrades.toLocaleString()} icon={<Activity size={14} />} color="#0A1EFF" />
                <Stat label="Total Volume" value={formatUSD(analysis.totalVolume)} icon={<Activity size={14} />} color="#FFD23F" />
                <Stat label="Avg Hold Time" value={formatHoldTime(analysis.avgHoldTime)} icon={<Clock size={14} />} color="#8C8DFC" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <div className="text-xs text-text-tertiary mb-1">30d PnL</div>
                  <div className={`text-xl font-bold font-mono ${analysis.pnl30d >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                    {analysis.pnl30d >= 0 ? '+' : ''}{formatUSD(analysis.pnl30d)}
                  </div>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <div className="text-xs text-text-tertiary mb-1">90d PnL</div>
                  <div className={`text-xl font-bold font-mono ${analysis.pnl90d >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                    {analysis.pnl90d >= 0 ? '+' : ''}{formatUSD(analysis.pnl90d)}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tokens */}
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Traded Tokens</h3>
              <div className="space-y-3">
                {analysis.topTokens.slice(0, 5).map((token, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border-subtle flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{token.symbol}</div>
                        <div className="text-xs text-text-tertiary">{token.trades} trades</div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${token.profit >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                      {token.profit >= 0 ? '+' : ''}{formatUSD(token.profit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            {analysis.redFlags.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Red Flags ({analysis.redFlags.length})
                </h3>
                <div className="space-y-2">
                  {analysis.redFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Activity Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-tertiary mb-1">First Seen</div>
                  <div className="text-white font-medium">
                    {new Date(analysis.firstSeen).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-tertiary mb-1">Last Active</div>
                  <div className="text-white font-medium">{formatTimeAgo(analysis.lastActive)}</div>
                </div>
              </div>
            </div>

            {/* No Red Flags Message */}
            {analysis.redFlags.length === 0 && (
              <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-electric-blue" />
                <div>
                  <div className="font-semibold text-white">Clean Wallet</div>
                  <div className="text-sm text-text-secondary">No suspicious activity detected in this wallet&apos;s history.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4">
      <div className="flex items-center gap-1 text-xs text-text-tertiary mb-2">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}

function formatHoldTime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
