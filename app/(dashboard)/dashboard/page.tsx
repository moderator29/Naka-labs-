'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Zap, Shield, Dna,
  ArrowRight, Activity, Bot, Star, Briefcase,
  ExternalLink, RefreshCw, Flame, Users,
} from 'lucide-react';
import { formatUSD, formatPercent, formatAddress } from '@/lib/utils/formatters';

/* ── Types ─────────────────────────────────────────────── */
interface MarketStat {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  icon?: string;
}

/* ── Mock Data ─────────────────────────────────────────── */
const MOCK_MARKET_DATA: MarketStat[] = [
  { symbol: 'BTC',  name: 'Bitcoin',   price: 67_240, change24h: 2.4,  volume24h: 44_570_000_000, marketCap: 1_350_000_000_000 },
  { symbol: 'ETH',  name: 'Ethereum',  price: 1_978,  change24h: -4.3, volume24h: 14_200_000_000, marketCap: 238_000_000_000 },
  { symbol: 'SOL',  name: 'Solana',    price: 84.06,  change24h: 0.88, volume24h: 4_100_000_000,  marketCap: 38_000_000_000 },
  { symbol: 'BNB',  name: 'BNB',       price: 627,    change24h: 0.5,  volume24h: 1_900_000_000,  marketCap: 91_000_000_000 },
  { symbol: 'HYPE', name: 'Hyperliquid',price: 31.71, change24h: 2.97, volume24h: 22_500_000,     marketCap: 10_600_000_000 },
];

const MOCK_SIGNALS = [
  { type: 'WHALE_MOVEMENT', token: 'ETH',  title: 'Whale moved 10,000 ETH ($19.8M) to Binance — sell pressure incoming', time: '2m ago',  risk: 'HIGH',     score: 94 },
  { type: 'SMART_MONEY',   token: 'DEGEN', title: '3 alpha wallets accumulated $1.2M of DEGEN on Base in 2 hours',      time: '8m ago',  risk: 'LOW',      score: 87 },
  { type: 'NEW_POOL',      token: 'PEPE2', title: 'New Raydium pool: PEPE2/SOL launched with $450K initial liquidity',   time: '15m ago', risk: 'MEDIUM',   score: 78 },
  { type: 'RUG_PULL_WARNING', token: 'SCAM', title: 'CRITICAL: Dev wallet unlocked 40% of supply — rug risk imminent', time: '22m ago', risk: 'CRITICAL', score: 22 },
  { type: 'BUY',           token: 'SOL',  title: 'Solana 193K txns in 1h — network demand up 23% driven by Pump.fun',   time: '30m ago', risk: 'LOW',      score: 88 },
  { type: 'UNUSUAL_VOLUME',token: 'WIF',  title: 'WIF volume explodes 340% — institutional accumulation detected',      time: '45m ago', risk: 'MEDIUM',   score: 72 },
];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  WHALE_MOVEMENT:    { label: 'WHALE',  color: '#FFD23F', bg: 'rgba(255,210,63,0.12)'  },
  SMART_MONEY:       { label: 'SMART',  color: '#00C6FF', bg: 'rgba(0,198,255,0.12)'   },
  RUG_PULL_WARNING:  { label: 'RUG ⚠',  color: '#FF3E3E', bg: 'rgba(255,62,62,0.12)'   },
  BUY:               { label: 'BULLISH',color: '#00D084', bg: 'rgba(0,208,132,0.12)'   },
  SELL:              { label: 'BEARISH',color: '#FF6B35', bg: 'rgba(255,107,53,0.12)'  },
  NEW_POOL:          { label: 'NEW',    color: '#7BA4FF', bg: 'rgba(123,164,255,0.12)' },
  UNUSUAL_VOLUME:    { label: 'HYPE',   color: '#FF6B35', bg: 'rgba(255,107,53,0.12)'  },
};

const RISK_COLORS: Record<string, string> = {
  LOW: '#00D084', MEDIUM: '#FFD23F', HIGH: '#FF6B35', CRITICAL: '#FF3E3E',
};

/* ── Quick Action Cards ─────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    href: '/market',
    icon: TrendingUp,
    label: 'Trade',
    desc: 'Multi-chain DEX terminal',
    color: '#1B4FFF',
    bg: 'rgba(27,79,255,0.1)',
    border: 'rgba(27,79,255,0.2)',
    glow: 'rgba(27,79,255,0.15)',
  },
  {
    href: '/context',
    icon: Zap,
    label: 'Context Feed',
    desc: 'Live whale & smart money signals',
    color: '#FFD23F',
    bg: 'rgba(255,210,63,0.1)',
    border: 'rgba(255,210,63,0.2)',
    glow: 'rgba(255,210,63,0.1)',
  },
  {
    href: '/dna-analyzer',
    icon: Dna,
    label: 'DNA Analyzer',
    desc: 'Decode wallet behavior',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.2)',
    glow: 'rgba(168,85,247,0.1)',
  },
  {
    href: '/scanner',
    icon: Shield,
    label: 'Scanner',
    desc: 'Token security audit',
    color: '#FF6B35',
    bg: 'rgba(255,107,53,0.1)',
    border: 'rgba(255,107,53,0.2)',
    glow: 'rgba(255,107,53,0.1)',
  },
  {
    href: '/vtx',
    icon: Bot,
    label: 'VTX AI',
    desc: 'Claude-powered Web3 AI',
    color: '#00C6FF',
    bg: 'rgba(0,198,255,0.1)',
    border: 'rgba(0,198,255,0.2)',
    glow: 'rgba(0,198,255,0.1)',
  },
  {
    href: '/social',
    icon: Users,
    label: 'Social',
    desc: 'Copy top traders',
    color: '#FF3A80',
    bg: 'rgba(255,58,128,0.1)',
    border: 'rgba(255,58,128,0.2)',
    glow: 'rgba(255,58,128,0.1)',
  },
];

/* ── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-4 hover:border-[#1B4FFF]/25 transition-all">
      <div className="text-[11px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="text-[22px] font-black font-mono" style={{ color: color ?? '#EEF2FF' }}>{value}</div>
      {sub && <div className="text-[11px] text-[#3D5270] mt-1">{sub}</div>}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────── */
export default function DashboardPage() {
  const account = useActiveAccount();
  const authenticated = !!account;
  const walletAddress = account?.address;
  const [marketData, setMarketData] = useState<MarketStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetch('/api/market/chart?type=overview')
      .then(r => r.json())
      .then(d => {
        setMarketData(d.coins?.length ? d.coins : MOCK_MARKET_DATA);
        setLastUpdate(new Date());
        setLoading(false);
      })
      .catch(() => {
        setMarketData(MOCK_MARKET_DATA);
        setLoading(false);
      });
  }, []);

  const displayMarket = marketData.length > 0 ? marketData : MOCK_MARKET_DATA;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[26px] font-black text-[#EEF2FF] leading-tight">
            {authenticated
              ? `Welcome back${walletAddress ? ', ' + formatAddress(walletAddress, 4) : ''}`
              : 'Steinz Labs'}
          </h1>
          <p className="text-[#3D5270] text-[13px] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#00D084] bg-[#00D084]/10 border border-[#00D084]/20 px-3 py-1.5 rounded-xl">
            <Activity size={10} className="animate-pulse" />
            <span>Live</span>
          </div>
          <button
            onClick={() => { setLoading(true); setTimeout(() => { setLastUpdate(new Date()); setLoading(false); }, 800); }}
            className="p-2 text-[#3D5270] hover:text-[#EEF2FF] hover:bg-white/5 rounded-xl transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Market Overview Stats ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {displayMarket.slice(0, 5).map(coin => (
          <Link
            key={coin.symbol}
            href={`/market?token=${coin.symbol}`}
            className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-4 hover:border-[#1B4FFF]/30 hover:shadow-[0_0_24px_rgba(27,79,255,0.12)] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B84A8] group-hover:text-[#7BA4FF] transition-colors">{coin.symbol}</span>
              <div className={`flex items-center gap-0.5 text-[10px] font-bold ${coin.change24h >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                {coin.change24h >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {Math.abs(coin.change24h).toFixed(1)}%
              </div>
            </div>
            <div className="text-[15px] font-black font-mono text-[#EEF2FF]">{formatUSD(coin.price)}</div>
            <div className="text-[10px] text-[#3D5270] mt-1">{coin.name}</div>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color, bg, border, glow }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: bg, borderColor: border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                style={{ background: `${color}20`, border: `1px solid ${color}30`, boxShadow: `0 0 12px ${glow}` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className="text-[13px] font-bold text-[#EEF2FF] leading-tight">{label}</div>
              <div className="text-[10px] text-[#3D5270] mt-1 leading-snug">{desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT: Portfolio Summary ──────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">Wallet</h2>
                <Link href="/portfolio" className="text-[11px] text-[#3D5270] hover:text-[#1B4FFF] flex items-center gap-1 transition-colors">
                  View All <ArrowRight size={10} />
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {authenticated ? (
                <div>
                  {/* Balance */}
                  <div className="text-[32px] font-black font-mono text-[#EEF2FF] leading-none mb-1">$0.00</div>
                  <div className="text-[12px] text-[#3D5270] mb-5">Total portfolio value</div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'P&L Today', value: '+$0.00', color: '#00D084' },
                      { label: 'Holdings', value: '0 tokens', color: '#EEF2FF' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#071020] rounded-xl p-3">
                        <div className="text-[10px] text-[#3D5270] mb-1">{s.label}</div>
                        <div className="text-[14px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    href="/portfolio"
                    className="block w-full text-center py-3 rounded-xl bg-[#1B4FFF]/12 border border-[#1B4FFF]/25 text-[#7BA4FF] text-[13px] font-semibold hover:bg-[#1B4FFF]/20 hover:border-[#1B4FFF]/40 transition-all"
                  >
                    Open Wallet →
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#1B4FFF]/10 border border-[#1B4FFF]/20 flex items-center justify-center mx-auto mb-4">
                    <Briefcase size={24} className="text-[#1B4FFF]" />
                  </div>
                  <div className="text-[#6B84A8] text-[13px] mb-4">Connect wallet to track your portfolio</div>
                  <Link
                    href="/portfolio"
                    className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#1B4FFF] to-[#0F3AE0] text-white text-[13px] font-bold hover:shadow-[0_0_24px_rgba(27,79,255,0.4)] transition-all"
                  >
                    Connect Wallet
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Watchlists preview */}
          <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">Watchlist</h2>
              <Link href="/watchlists" className="text-[11px] text-[#3D5270] hover:text-[#1B4FFF] flex items-center gap-1 transition-colors">
                Manage <ArrowRight size={10} />
              </Link>
            </div>
            <div className="space-y-2">
              {['BTC', 'ETH', 'SOL'].map(sym => {
                const coin = displayMarket.find(c => c.symbol === sym);
                return (
                  <Link key={sym} href={`/market?token=${sym}`}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-center gap-2">
                      <Star size={10} className="text-[#FFD23F] fill-[#FFD23F]" />
                      <span className="text-[13px] font-semibold text-[#EEF2FF]">{sym}</span>
                    </div>
                    {coin && (
                      <div className="text-right">
                        <div className="text-[12px] font-mono text-[#EEF2FF]">{formatUSD(coin.price)}</div>
                        <div className={`text-[10px] ${coin.change24h >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                          {formatPercent(coin.change24h)}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
              <Link href="/watchlists"
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/10 text-[11px] text-[#3D5270] hover:border-[#1B4FFF]/30 hover:text-[#1B4FFF] transition-all">
                <Star size={10} />
                Add token
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER + RIGHT: Market + Signals ──────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Market Table ─────────────────────────────────── */}
          <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">Market Overview</h2>
              <Link href="/market" className="text-[11px] text-[#3D5270] hover:text-[#1B4FFF] flex items-center gap-1 transition-colors">
                Terminal <ArrowRight size={10} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Token', 'Price', '24h', 'Volume', 'Mkt Cap', ''].map(h => (
                      <th key={h} className={`text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider px-4 py-3 ${h === 'Token' ? 'text-left' : 'text-right'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 skeleton rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    displayMarket.map(coin => (
                      <tr key={coin.symbol} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0F1E35] border border-white/8 flex items-center justify-center text-[10px] font-bold text-[#6B84A8]">
                              {coin.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#EEF2FF]">{coin.symbol}</div>
                              <div className="text-[10px] text-[#3D5270]">{coin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[13px] text-[#EEF2FF] font-semibold">
                          {formatUSD(coin.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`flex items-center justify-end gap-1 text-[12px] font-semibold ${coin.change24h >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                            {coin.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {formatPercent(coin.change24h)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#6B84A8]">
                          {formatUSD(coin.volume24h)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12px] text-[#6B84A8]">
                          {coin.marketCap ? formatUSD(coin.marketCap) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/market?token=${coin.symbol}`}
                            className="text-[10px] text-[#1B4FFF] opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 transition-opacity font-semibold"
                          >
                            Trade <ExternalLink size={9} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Signals ────────────────────────────────── */}
          <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">Live Signals</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-[#00D084]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse" />
                  Live
                </div>
              </div>
              <Link href="/context" className="text-[11px] text-[#3D5270] hover:text-[#1B4FFF] flex items-center gap-1 transition-colors">
                Feed <ArrowRight size={10} />
              </Link>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {MOCK_SIGNALS.map((signal, i) => {
                const typeConf = TYPE_CONFIG[signal.type] ?? { label: signal.type, color: '#6B84A8', bg: 'rgba(107,132,168,0.12)' };
                const riskColor = RISK_COLORS[signal.risk] ?? '#6B84A8';

                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    {/* Type badge */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span
                        className="text-[9px] font-black px-2 py-1 rounded-lg"
                        style={{ background: typeConf.bg, color: typeConf.color }}
                      >
                        {typeConf.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-[#EEF2FF] leading-snug line-clamp-1 mb-1">
                        {signal.title}
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="font-bold text-[#7BA4FF]">{signal.token}</span>
                        <span className="text-[#3D5270]">{signal.time}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${signal.score}%`, backgroundColor: riskColor }} />
                          </div>
                          <span className="font-bold" style={{ color: riskColor }}>{signal.risk}</span>
                        </div>
                      </div>
                    </div>

                    {/* View */}
                    <Link
                      href="/context"
                      className="flex-shrink-0 text-[10px] text-[#A855F7] hover:text-[#C084FC] transition-colors font-semibold whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Row ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Signals Today" value="127" sub="↑ 23% vs yesterday" color="#EEF2FF" />
        <StatCard label="Whale Alerts" value="14" sub="3 critical, 11 high" color="#FFD23F" />
        <StatCard label="New Pools" value="842" sub="Solana, Base, ETH" color="#1B4FFF" />
        <StatCard label="Rugs Detected" value="6" sub="⚠ All CRITICAL risk" color="#FF3E3E" />
      </div>

      {/* ── Activity Feed ──────────────────────────────────── */}
      <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em] flex items-center gap-2">
            <Flame size={12} className="text-[#FF6B35]" />
            Trending Now
          </h2>
          <Link href="/market" className="text-[11px] text-[#3D5270] hover:text-[#1B4FFF] transition-colors">
            See all →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {['NEAR +20.5%', 'DEGEN +12.4%', 'MON +8.3%', 'HYPE +3.0%', 'WIF -5.2%', 'LIT -4.8%', 'BONK +3.1%', 'PEPE +6.2%'].map(item => {
            const isPos = item.includes('+');
            const [sym, pct] = item.split(' ');
            return (
              <Link
                key={sym}
                href={`/market?token=${sym}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all hover:-translate-y-0.5"
                style={{
                  background: isPos ? 'rgba(0,208,132,0.08)' : 'rgba(255,62,62,0.08)',
                  borderColor: isPos ? 'rgba(0,208,132,0.2)' : 'rgba(255,62,62,0.2)',
                }}
              >
                <span className="text-[12px] font-bold text-[#EEF2FF]">{sym}</span>
                <span className="text-[11px] font-bold" style={{ color: isPos ? '#00D084' : '#FF3E3E' }}>{pct}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
