'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Zap, Shield, Dna, BarChart2, ArrowRight, Activity } from 'lucide-react';
import { formatUSD, formatPercent, formatAddress } from '@/lib/utils/formatters';

interface MarketStat {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const QUICK_ACTIONS = [
  { href: '/market', icon: TrendingUp, label: 'Trade', color: '#00E5FF', desc: 'Buy & sell tokens' },
  { href: '/context', icon: Zap, label: 'Signals', color: '#0A1EFF', desc: 'Live intelligence feed' },
  { href: '/dna-analyzer', icon: Dna, label: 'Analyze', color: '#8C8DFC', desc: 'Wallet DNA analysis' },
  { href: '/scanner', icon: Shield, label: 'Scan', color: '#FF6B35', desc: 'Token security scan' },
];

export default function DashboardPage() {
  const account = useActiveAccount();
  const authenticated = !!account;
  const walletAddress = account?.address;
  const [marketData, setMarketData] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market/chart?type=overview')
      .then((r) => r.json())
      .then((d) => {
        setMarketData(d.coins ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {authenticated
              ? `Welcome back${walletAddress ? ', ' + formatAddress(walletAddress, 6) : ''}!`
              : 'Welcome to Naka Labs'}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Your Web3 intelligence hub — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-electric-blue">
          <Activity size={12} className="animate-pulse" />
          All systems live
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, color, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-bg-secondary border border-border-default rounded-xl p-4 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(10,30,255,0.2)] transition-all group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div className="font-semibold text-white group-hover:text-neon-blue transition-colors">{label}</div>
            <div className="text-xs text-text-tertiary mt-1">{desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <div className="lg:col-span-1 bg-bg-secondary border border-border-default rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Portfolio</h2>
            <Link href="/portfolio" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
              View All <ArrowRight size={10} />
            </Link>
          </div>

          {authenticated ? (
            <div>
              <div className="text-3xl font-black font-mono text-white mb-1">$0.00</div>
              <div className="text-sm text-text-secondary">Connect a wallet to see your portfolio</div>
              <Link
                href="/portfolio"
                className="mt-4 block w-full text-center py-2.5 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm font-semibold hover:bg-neon-blue/20 transition-colors"
              >
                Add Wallet
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-text-tertiary text-sm mb-3">Connect wallet to view portfolio</div>
            </div>
          )}
        </div>

        {/* Market Overview */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Market Overview</h2>
            <Link href="/market" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
              Trade <ArrowRight size={10} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 skeleton rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(marketData.length > 0 ? marketData : MOCK_MARKET_DATA).map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-secondary">
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{coin.symbol}</div>
                      <div className="text-xs text-text-tertiary">{coin.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">{formatUSD(coin.price)}</div>
                    <div className={`text-xs flex items-center gap-1 justify-end ${coin.change24h >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                      {coin.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {formatPercent(coin.change24h)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Signals */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Signals</h2>
          <Link href="/context" className="text-xs text-neon-blue hover:underline flex items-center gap-1">
            View All <ArrowRight size={10} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {MOCK_SIGNALS.map((signal, i) => (
            <div key={i} className="bg-bg-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: signal.type === 'BUY' ? '#00E5FF20' : signal.type === 'WHALE_MOVEMENT' ? '#FFD23F20' : '#FF6B3520',
                    color: signal.type === 'BUY' ? '#00E5FF' : signal.type === 'WHALE_MOVEMENT' ? '#FFD23F' : '#FF6B35',
                  }}
                >
                  {signal.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-text-tertiary">{signal.time}</span>
              </div>
              <div className="font-semibold text-white text-sm mb-1">{signal.token}</div>
              <div className="text-xs text-text-secondary line-clamp-2">{signal.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MOCK_MARKET_DATA: MarketStat[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 87240, change24h: 2.4, volume24h: 28_000_000_000 },
  { symbol: 'ETH', name: 'Ethereum', price: 3247, change24h: 1.8, volume24h: 15_000_000_000 },
  { symbol: 'SOL', name: 'Solana', price: 182, change24h: -0.5, volume24h: 4_000_000_000 },
  { symbol: 'BNB', name: 'BNB', price: 598, change24h: 3.2, volume24h: 2_000_000_000 },
];

const MOCK_SIGNALS = [
  { type: 'WHALE_MOVEMENT', token: 'ETH', title: 'Whale moved 5,000 ETH ($16.2M) to Binance — possible sell pressure incoming', time: '2m ago' },
  { type: 'BUY', token: 'ARB', title: 'Smart money accumulating ARB — 3 wallets added $2.4M in last hour', time: '8m ago' },
  { type: 'SELL', token: 'PEPE', title: 'Dev wallet moved 2% of supply — caution advised for PEPE holders', time: '15m ago' },
];
