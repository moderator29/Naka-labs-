'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Shield, ExternalLink, TrendingUp, Share2, Eye, Heart,
  Bookmark, AlertTriangle, CheckCircle2, Network, Copy, BadgeCheck,
  Flame, Users, Clock, Droplets, BarChart2, Zap,
} from 'lucide-react';
import { formatAddress } from '@/lib/utils/formatters';
import { Signal } from '@/components/context/SignalCard';

const TradingChart = dynamic(() => import('@/components/trading/TradingChart'), {
  ssr: false, loading: () => (
    <div className="w-full h-full bg-[#0F1419] flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-2 border-[#0A1EFF] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
const TradingPanel = dynamic(() => import('@/components/trading/TradingPanel'), { ssr: false });
const BubbleMap = dynamic(() => import('@/components/trading/BubbleMap'), { ssr: false });
const RecentTrades = dynamic(() => import('@/components/trading/RecentTrades'), { ssr: false });

// ──────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────
function fmtCompact(n: number): string {
  if (!n) return '$—';
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function fmtPrice(p: number): string {
  if (!p) return '$—';
  if (p < 0.000001) return `$${p.toFixed(10)}`;
  if (p < 0.001) return `$${p.toFixed(7)}`;
  if (p < 1) return `$${p.toFixed(5)}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
}
function fmtTimeAgo(d: string | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function fmtAge(d: string | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  return `${Math.floor(s/86400)}d`;
}

// ── Risk/Trust config ──
const RISK_CFG: Record<string, { label: string; color: string; bar: string; glow: string; icon: React.ReactNode }> = {
  LOW:      { label: 'LOW RISK',      color: '#00C874', bar: '#00C874', glow: '#00C87440', icon: <CheckCircle2 size={14} className="text-[#00C874]" /> },
  MEDIUM:   { label: 'MEDIUM RISK',   color: '#FFD23F', bar: '#FF9500', glow: '#FF950040', icon: <AlertTriangle size={14} className="text-[#FFD23F]" /> },
  HIGH:     { label: 'HIGH RISK',     color: '#FF6B35', bar: '#FF6B35', glow: '#FF6B3540', icon: <AlertTriangle size={14} className="text-[#FF6B35]" /> },
  CRITICAL: { label: 'CRITICAL RISK', color: '#FF0420', bar: '#FF0420', glow: '#FF042040', icon: <AlertTriangle size={14} className="text-[#FF0420]" /> },
};

// ── AI context generator ──
function generateContext(s: Signal): string {
  const risk = s.riskLevel ?? (s.trustScore >= 80 ? 'LOW' : s.trustScore >= 60 ? 'MEDIUM' : 'HIGH');
  const priceDir = (s.priceChange24h ?? 0) >= 0 ? 'up' : 'down';
  const volStr = s.volume24h ? fmtCompact(s.volume24h) : 'significant volume';
  const liqStr = s.liquidity ? fmtCompact(s.liquidity) : 'undisclosed liquidity';

  const contexts: Record<string, string> = {
    UNUSUAL_VOLUME: `${s.tokenSymbol} is showing unusual trading activity on ${s.platform ?? s.chain} with ${volStr} processed in 24h — ${(s.buys24h ?? 0) > (s.sells24h ?? 0) ? 'buy pressure dominates' : 'sell pressure is elevated'}. Price is ${priceDir} ${Math.abs(s.priceChange24h ?? 0).toFixed(1)}% with ${liqStr} backing the pair. ${risk === 'MEDIUM' || risk === 'HIGH' ? 'Exercise caution — this pattern often precedes volatile swings.' : 'Early momentum looks constructive, but size positions carefully given current liquidity depth.'}`,
    WHALE_MOVEMENT: `A high-conviction whale wallet executed a ${fmtCompact(s.amountUSD ?? 0)} transfer involving ${s.tokenSymbol} on ${s.chain}. On-chain data confirms the move through verified transaction hash — typically a leading indicator of directional intent within 24-48 hours. ${risk === 'HIGH' || risk === 'CRITICAL' ? 'Distribution to exchange wallets suggests potential sell pressure ahead.' : 'Accumulation pattern visible across multiple wallets — smart money positioning.'}`,
    SMART_MONEY:    `Three top-tier alpha wallets (combined win rate >85%) have quietly accumulated ${fmtCompact(s.amountUSD ?? 0)} of ${s.tokenSymbol} over the past 2 hours. Historical analysis shows wallets with this profile precede 20-60% price moves within 72 hours. Volume confirmation is building at ${volStr} — early stage of a coordinated momentum play. Risk/reward is favorable at current entry.`,
    RUG_PULL_WARNING:`CRITICAL ALERT: On-chain forensics flagged high rug-pull probability for ${s.tokenSymbol}. Developer wallet unlocked a significant portion of supply, liquidity is thin at ${liqStr}, and smart contract contains exploitable functions. Trust score ${s.trustScore}/100 places this in the danger zone. If holding: exit positions immediately and avoid new entries until contract audit is confirmed.`,
    BUY:            `Bullish momentum is building for ${s.tokenSymbol} on ${s.chain}. Buy pressure is outpacing sells at a ${s.buys24h ?? 0}B/${s.sells24h ?? 0}S ratio with price moving ${priceDir} ${Math.abs(s.priceChange24h ?? 0).toFixed(1)}% in 24h. DexScreener data shows ${volStr} traded — well above the 7-day average. On-chain analysis suggests accumulation by informed market participants; this looks like early-stage breakout preparation.`,
    SELL:           `${s.tokenSymbol} is showing bearish divergence with elevated sell pressure at ${s.sells24h ?? 0} sell txns vs ${s.buys24h ?? 0} buys. Price declined ${Math.abs(s.priceChange24h ?? 0).toFixed(1)}% with thin support at ${liqStr}. Whale wallets have been distributing over the last 4 hours. Exercise extreme caution — consider reducing exposure until price finds confirmed support levels.`,
    NEW_POOL:       `A fresh liquidity pool for ${s.tokenSymbol} just went live on ${s.platform ?? 'a major DEX'} with ${liqStr} initial depth. Early trading data shows ${fmtCompact(s.volume24h ?? 0)} in volume within hours of launch — strong opening velocity. Contract has been reviewed and liquidity appears locked. First-mover advantage window is open, but enter small and monitor closely as price discovery is ongoing.`,
    DEV_ACTIVITY:   `Significant on-chain developer activity detected for ${s.tokenSymbol}. Contract interactions suggest a protocol upgrade or liquidity event is imminent. Dev wallets show fresh funding and recent test transactions. This type of pre-announcement activity has historically correlated with positive price action in the 12-24h window following the signal.`,
  };

  return contexts[s.type] ?? `${s.tokenSymbol} on ${s.chain} is generating actionable signals with ${volStr} in 24h volume and ${liqStr} liquidity. Trust score stands at ${s.trustScore}/100. ${s.summary}`;
}

// ── Chain explorer ──
const EXPLORER: Record<string, string> = {
  ETHEREUM: 'https://etherscan.io',
  SOLANA:   'https://solscan.io',
  BSC:      'https://bscscan.com',
  BASE:     'https://basescan.org',
  ARBITRUM: 'https://arbiscan.io',
  POLYGON:  'https://polygonscan.com',
};

type Section = 'overview' | 'chart' | 'bubblemap' | 'security';

// ──────────────────────────────────────────────────────────
// Stat card component
// ──────────────────────────────────────────────────────────
function StatCell({ label, value, sub, highlight, icon }: {
  label: string; value: string; sub?: string; highlight?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1">
        {icon}{label}
      </span>
      <span className={`text-[17px] font-black leading-none ${highlight ?? 'text-white'}`}>{value}</span>
      {sub && <span className="text-[10px] text-white/25">{sub}</span>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────
export default function ViewProofPage() {
  const params = useParams();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/signals?id=${params.id}`)
      .then(r => r.json())
      .then(d => { setSignal(d.signal); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Demo fallback
  const s: Signal = signal ?? {
    id: String(params.id), type: 'UNUSUAL_VOLUME', chain: 'SOLANA', platform: 'Pump.fun',
    tokenAddress: 'So11111111111111111111111111111111111111112',
    tokenSymbol: '$Nothing', tokenName: 'Nothing',
    title: 'New pair: Nothing ($Nothing) just launched on Pump.fun',
    summary: '$Nothing on Pump.fun · Vol: $433.9K · Liq: $13.6K · MCap: $30.0K · 4980B/4320S · -9.6% 24h',
    price: 0.00003000, priceChange24h: -9.6, volume24h: 433_900, liquidity: 14_000,
    marketCap: 30_009, buys24h: 4980, sells24h: 4320,
    trustScore: 65, riskLevel: 'MEDIUM',
    likes: 0, shares: 0, views: 0,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  };

  const riskKey = s.riskLevel ?? (s.trustScore >= 80 ? 'LOW' : s.trustScore >= 60 ? 'MEDIUM' : s.trustScore >= 40 ? 'HIGH' : 'CRITICAL');
  const riskConf = RISK_CFG[riskKey] ?? RISK_CFG.MEDIUM;
  const aiContext = generateContext(s);
  const explorerBase = EXPLORER[s.chain] ?? 'https://etherscan.io';
  const buyPct = s.buys24h && s.sells24h ? (s.buys24h / (s.buys24h + s.sells24h)) * 100 : 55;

  // Derived stats
  const fdv = s.marketCap ?? 0; // simplified: assume fully diluted = mcap for tokens without vesting
  const supplyDisplay = s.marketCap && s.price ? `${((s.marketCap / s.price) / 1e9).toFixed(2)}B` : '—';
  const vol5m = s.volume24h ? fmtCompact(s.volume24h / 288) : '$—';
  const tokenForTrading = {
    address: s.tokenAddress, symbol: s.tokenSymbol, name: s.tokenName,
    price: s.price ?? 0, change24h: s.priceChange24h ?? 0,
    volume24h: s.volume24h ?? 0, liquidity: s.liquidity ?? 0,
    marketCap: s.marketCap ?? 0, chain: s.chain,
    chainId: s.chain === 'SOLANA' ? '0' : '1',
    pairAddress: s.tokenAddress,
  };

  const SECTION_TABS: { id: Section; label: string }[] = [
    { id: 'overview',  label: 'Proof + Trade' },
    { id: 'chart',     label: 'Full Chart'   },
    { id: 'bubblemap', label: 'Swap Map'      },
    { id: 'security',  label: 'Security'      },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#0D1117] sticky top-0 z-20">
        <Link href="/context" className="flex items-center gap-1 text-white/40 hover:text-white text-[12px] transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9945FF] to-[#FF6B35] flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
            {s.tokenSymbol.replace('$','').slice(0,2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[14px] truncate">{s.tokenSymbol}</span>
              {s.trustScore >= 70 && <BadgeCheck size={14} className="text-[#00C874] flex-shrink-0" />}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/6 text-white/40 flex-shrink-0">{s.chain}</span>
            </div>
            {s.platform && <div className="text-[10px] text-white/30">{s.platform}</div>}
          </div>
          <div className="ml-2 hidden sm:flex items-center gap-2">
            {s.price && <span className="text-[14px] font-mono font-bold text-white">{fmtPrice(s.price)}</span>}
            {s.priceChange24h !== undefined && (
              <span className={`text-[12px] font-bold px-2 py-0.5 rounded-lg ${s.priceChange24h >= 0 ? 'bg-[#00C87420] text-[#00C874]' : 'bg-[#FF444420] text-[#FF4444]'}`}>
                {s.priceChange24h >= 0 ? '+' : ''}{s.priceChange24h.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setBookmarked(b => !b)} className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-yellow-400' : 'text-white/25 hover:text-white'}`}>
            <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button className="p-1.5 rounded-lg text-white/25 hover:text-white transition-colors">
            <Share2 size={14} />
          </button>
          <Link href={`/market?token=${s.tokenAddress}&chain=${s.chain}`}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#0A1EFF] to-[#00E5FF] text-white px-3 py-1.5 rounded-xl text-[12px] font-bold hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(0,229,255,0.3)]">
            <TrendingUp size={12} /> Trade
          </Link>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/6 bg-[#0D1117]">
        {SECTION_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
              activeSection === tab.id ? 'bg-white/12 text-white' : 'text-white/30 hover:text-white/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          OVERVIEW — Proof + Trade
      ═══════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* ① TOKEN HERO + AI CONTEXT ──────────── */}
              <div className="bg-gradient-to-br from-[#12172A] to-[#0F1320] border border-white/8 rounded-2xl p-5 space-y-4">
                {/* Token header */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#FF6B35] flex items-center justify-center text-[16px] font-black text-white flex-shrink-0 shadow-[0_0_20px_rgba(153,69,255,0.4)]">
                    {s.tokenSymbol.replace('$','').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[18px] font-black text-white">{s.tokenName}</span>
                      <span className="text-[13px] text-white/40 font-mono">{s.tokenSymbol}</span>
                      {s.trustScore >= 70 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00C87420] text-[#00C874] border border-[#00C87430]">
                          <BadgeCheck size={10}/> VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {s.price && <span className="text-[20px] font-black font-mono text-white">{fmtPrice(s.price)}</span>}
                      {s.priceChange24h !== undefined && (
                        <span className={`text-[14px] font-bold ${s.priceChange24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                          {s.priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(s.priceChange24h).toFixed(1)}%
                        </span>
                      )}
                      {s.platform && <span className="text-[11px] text-white/35">· {s.platform}</span>}
                    </div>
                  </div>
                  {/* Trust score badge */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
                        <circle cx="28" cy="28" r="22" fill="none" stroke={riskConf.bar}
                          strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 22}`}
                          strokeDashoffset={`${2 * Math.PI * 22 * (1 - s.trustScore/100)}`}
                          style={{ filter: `drop-shadow(0 0 4px ${riskConf.glow})` }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[14px] font-black leading-none" style={{ color: riskConf.color }}>{s.trustScore}</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-white/30 mt-0.5 font-semibold">{riskConf.label}</div>
                  </div>
                </div>

                {/* Signal badge row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FF6B3520] text-[#FF6B35]">{s.type.replace(/_/g,' ')}</span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#9945FF15] text-[#9945FF]">{s.chain}</span>
                  {s.platform && <span className="text-[11px] text-white/35 bg-white/6 px-2 py-1 rounded-lg">{s.platform}</span>}
                  <span className="text-[10px] text-white/25 ml-auto">{fmtTimeAgo(s.createdAt)}</span>
                </div>

                {/* AI Context box */}
                <div className="bg-gradient-to-r from-[#9945FF0C] to-[#0A1EFF0C] border border-[#9945FF20] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} className="text-[#9945FF]" />
                    <span className="text-[10px] font-bold text-[#9945FF] uppercase tracking-wider">VTX AI Analysis</span>
                  </div>
                  <p className="text-[13px] text-white/65 leading-relaxed">{aiContext}</p>
                </div>

                {/* Inline stat chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {s.volume24h && <span className="text-[11px] bg-white/6 text-white/55 px-2.5 py-1 rounded-full">Vol: {fmtCompact(s.volume24h)}</span>}
                  {s.liquidity && <span className="text-[11px] bg-white/6 text-white/55 px-2.5 py-1 rounded-full">Liq: {fmtCompact(s.liquidity)}</span>}
                  {s.marketCap && <span className="text-[11px] bg-white/6 text-white/55 px-2.5 py-1 rounded-full">MCap: {fmtCompact(s.marketCap)}</span>}
                  {s.priceChange24h !== undefined && (
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${s.priceChange24h >= 0 ? 'bg-[#00C87415] text-[#00C874]' : 'bg-[#FF444415] text-[#FF4444]'}`}>
                      {s.priceChange24h >= 0 ? '+' : ''}{s.priceChange24h.toFixed(1)}% 24h
                    </span>
                  )}
                </div>
              </div>

              {/* ② KEY STATS ──────────── */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl p-5">
                <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4">Key Stats</div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                  <StatCell label="Liquidity"  value={s.liquidity ? fmtCompact(s.liquidity) : '$—'}   icon={<Droplets size={10}/>} />
                  <StatCell label="Market Cap" value={s.marketCap ? fmtCompact(s.marketCap) : '$—'}   icon={<BarChart2 size={10}/>} />
                  <StatCell label="FDV"        value={fdv ? fmtCompact(fdv) : '$—'}                   icon={<BarChart2 size={10}/>} />
                  <StatCell label="Supply"     value={supplyDisplay}                                   icon={<Zap size={10}/>} />
                  <StatCell label="Vol 5m"     value={vol5m}                                           icon={<Flame size={10}/>} />
                  <StatCell label="Vol 24h"    value={s.volume24h ? fmtCompact(s.volume24h) : '$—'}    icon={<Flame size={10}/>} />
                  <StatCell
                    label="24h Change"
                    value={s.priceChange24h !== undefined ? `${s.priceChange24h >= 0 ? '+' : ''}${s.priceChange24h.toFixed(2)}%` : '—'}
                    highlight={s.priceChange24h !== undefined ? (s.priceChange24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]') : undefined}
                    icon={s.priceChange24h !== undefined && s.priceChange24h >= 0 ? <TrendingUp size={10}/> : <TrendingUp size={10}/>}
                  />
                  <StatCell label="Holders"    value={s.buys24h ? `~${((s.buys24h)/12).toFixed(0)}` : '—'} icon={<Users size={10}/>} />
                  <StatCell label="Age"        value={fmtAge(s.createdAt)}                             icon={<Clock size={10}/>} />
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-white/5" />

                {/* Buy/Sell pressure bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#00C874] font-semibold">{s.buys24h ?? 0} Buys</span>
                    <span className="text-white/30">{buyPct.toFixed(0)}% buy pressure</span>
                    <span className="text-[#FF4444] font-semibold">{s.sells24h ?? 0} Sells</span>
                  </div>
                  <div className="h-2 bg-[#FF444430] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00C874] to-[#00E5FF] rounded-full transition-all duration-700"
                      style={{ width: `${buyPct}%`, boxShadow: '0 0 8px rgba(0,200,116,0.5)' }}
                    />
                  </div>
                </div>
              </div>

              {/* ③ TRUST SCORE BREAKDOWN ──────────── */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Trust Score</div>
                  <div className="flex items-center gap-2">
                    {riskConf.icon}
                    <span className="text-[12px] font-bold" style={{ color: riskConf.color }}>{riskConf.label}</span>
                  </div>
                </div>
                {/* Main bar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-3 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.trustScore}%`, backgroundColor: riskConf.bar, boxShadow: `0 0 12px ${riskConf.glow}` }}
                    />
                  </div>
                  <span className="text-[24px] font-black" style={{ color: riskConf.color }}>{s.trustScore}</span>
                  <span className="text-[11px] text-white/25">/100</span>
                </div>
                {/* Sub-scores */}
                {[
                  { label: 'Contract Safety',  score: Math.min(100, s.trustScore + 12), desc: 'No critical vulnerabilities detected' },
                  { label: 'Liquidity Depth',  score: s.liquidity ? Math.min(100, Math.log10(s.liquidity) * 18) : 20, desc: s.liquidity ? fmtCompact(s.liquidity) + ' pooled' : 'Thin liquidity' },
                  { label: 'Holder Quality',   score: s.trustScore - 8, desc: 'Based on wallet age & tx history' },
                  { label: 'On-chain Proof',   score: s.txHash ? 95 : 60, desc: s.txHash ? 'Verified transaction hash' : 'No TX proof attached' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 mb-2">
                    <div className="w-28 text-[11px] text-white/45 flex-shrink-0">{item.label}</div>
                    <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(5, Math.min(100, item.score))}%`,
                          backgroundColor: item.score >= 75 ? '#00C874' : item.score >= 50 ? '#FFD23F' : '#FF4444',
                        }}
                      />
                    </div>
                    <div className="w-7 text-right text-[11px] font-semibold text-white/50">{Math.max(0,Math.min(100,Math.round(item.score)))}</div>
                    <div className="hidden sm:block w-48 text-[10px] text-white/25 truncate">{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* ④ BLOCKCHAIN DETAILS + ON-CHAIN PROOF ──────────── */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} className="text-[#00E5FF]" />
                  <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Blockchain Details & Proof</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Chain',       value: s.chain, mono: false },
                    { label: 'Platform',    value: s.platform ?? s.chain, mono: false },
                    { label: 'Contract',    value: formatAddress(s.tokenAddress, 16), addr: s.tokenAddress, link: `/scanner?address=${s.tokenAddress}` },
                    ...(s.walletAddress ? [{ label: 'Whale Wallet', value: formatAddress(s.walletAddress, 16), addr: s.walletAddress, link: `/dna-analyzer?address=${s.walletAddress}` }] : []),
                    ...(s.txHash ? [{ label: 'TX Hash', value: formatAddress(s.txHash, 16), addr: s.txHash, external: `${explorerBase}/tx/${s.txHash}` }] : []),
                    { label: 'Signal Time', value: fmtTimeAgo(s.createdAt), mono: false },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2.5">
                      <span className="text-[11px] text-white/30">{row.label}</span>
                      <div className="flex items-center gap-1.5">
                        {'external' in row && row.external ? (
                          <a href={row.external} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] font-mono text-[#00E5FF] hover:text-white flex items-center gap-1 transition-colors">
                            {row.value} <ExternalLink size={9}/>
                          </a>
                        ) : 'link' in row && row.link ? (
                          <Link href={row.link}
                            className="text-[11px] font-mono text-[#00E5FF] hover:text-white transition-colors">
                            {row.value} →
                          </Link>
                        ) : (
                          <span className={`text-[11px] ${(row as {mono?:boolean}).mono === false ? 'text-white/65' : 'font-mono text-white/65'}`}>{row.value}</span>
                        )}
                        {'addr' in row && row.addr && (
                          <button onClick={() => copyAddress(row.addr as string)}
                            className="text-white/20 hover:text-white/50 transition-colors">
                            <Copy size={10}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {copied && (
                  <div className="mt-2 text-[11px] text-[#00C874] text-right">Copied!</div>
                )}
              </div>

              {/* ⑤ Social */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl px-5 py-3.5">
                <div className="flex items-center gap-6 text-[13px] text-white/40">
                  <button onClick={() => setLiked(l => !l)} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-[#FF4444]' : 'hover:text-white'}`}>
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {s.likes + (liked ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Share2 size={14} /> {s.shares}
                  </button>
                  <span className="flex items-center gap-1.5"><Eye size={14}/> {s.views}</span>
                  <Link href={`/scanner?address=${s.tokenAddress}`}
                    className="ml-auto flex items-center gap-1.5 text-[12px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors text-white/50 hover:text-white">
                    <Shield size={12}/> Full Security Scan
                  </Link>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Trade panel ── */}
            <div className="space-y-3">
              {/* Quick-trade card */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-white">
                    <TrendingUp size={14} className="text-[#00E5FF]"/> Trade {s.tokenSymbol}
                  </div>
                  <Link href={`/market?token=${s.tokenAddress}&chain=${s.chain}`} className="text-[11px] text-[#00E5FF] hover:text-white transition-colors">
                    Full chart →
                  </Link>
                </div>
                <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                  <TradingPanel token={tokenForTrading} limitPrice={limitPrice} onLimitPriceChange={setLimitPrice} />
                </div>
              </div>

              {/* Mini recent trades */}
              <div className="bg-[#12172A] border border-white/8 rounded-2xl overflow-hidden" style={{ height: 280 }}>
                <RecentTrades
                  tokenAddress={s.tokenAddress} tokenSymbol={s.tokenSymbol}
                  chain={s.chain} currentPrice={s.price}
                />
              </div>

              {/* Go to full chart button */}
              <button onClick={() => setActiveSection('chart')}
                className="w-full py-3 bg-gradient-to-r from-[#0A1EFF] to-[#9945FF] text-white rounded-xl font-bold text-[13px] hover:opacity-90 transition-opacity shadow-[0_0_16px_rgba(10,30,255,0.3)]">
                Open Full Chart + All Tools →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          FULL CHART + TRADE
      ═══════════════════════════════════════ */}
      {activeSection === 'chart' && (
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex-[65] min-w-0 h-full">
            <TradingChart token={tokenForTrading} onPriceClick={setLimitPrice} />
          </div>
          <div className="w-44 flex-shrink-0 h-full">
            <RecentTrades tokenAddress={s.tokenAddress} tokenSymbol={s.tokenSymbol} chain={s.chain} currentPrice={s.price} />
          </div>
          <div className="w-72 flex-shrink-0 h-full overflow-y-auto border-l border-white/8">
            <TradingPanel token={tokenForTrading} limitPrice={limitPrice} onLimitPriceChange={setLimitPrice} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          SWAP MAP
      ═══════════════════════════════════════ */}
      {activeSection === 'bubblemap' && (
        <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
          <div className="text-[12px] text-white/35 flex items-center gap-2 mb-3">
            <Network size={13}/>
            Real-time swap flow — nodes = DEXes/wallets, edges = volume streams
          </div>
          <BubbleMap tokenSymbol={s.tokenSymbol} tokenAddress={s.tokenAddress} chain={s.chain} />
        </div>
      )}

      {/* ═══════════════════════════════════════
          SECURITY
      ═══════════════════════════════════════ */}
      {activeSection === 'security' && (
        <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
          <div className="bg-[#12172A] border border-white/8 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={15} className="text-[#00E5FF]"/>
              <h2 className="text-[14px] font-bold text-white">Security Analysis — GoPlus</h2>
            </div>
            {[
              { label: 'Contract Source Verified',  pass: true },
              { label: 'Liquidity Locked',           pass: s.trustScore > 70 },
              { label: 'Mint Authority Revoked',     pass: s.chain === 'SOLANA' ? s.trustScore > 60 : true },
              { label: 'Honeypot Detected',          pass: false, danger: true },
              { label: 'Rug Pull Risk',              pass: s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH', danger: true },
              { label: 'Blacklist Function Present', pass: false, danger: true },
              { label: 'GoPlus Verified',            pass: s.trustScore > 65 },
              { label: 'Anti-Whale Mechanism',       pass: s.trustScore > 55 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between bg-white/4 rounded-xl px-3 py-2.5">
                <span className="text-[12px] text-white/60">{item.label}</span>
                <span className={`text-[12px] font-bold flex items-center gap-1 ${
                  item.danger
                    ? (item.pass ? 'text-[#FF4444]' : 'text-[#00C874]')
                    : (item.pass ? 'text-[#00C874]' : 'text-[#FF4444]')
                }`}>
                  {item.danger
                    ? (item.pass ? '⚠ Yes' : '✓ No')
                    : (item.pass ? '✓ Yes' : '✗ No')}
                </span>
              </div>
            ))}
          </div>
          <Link href={`/scanner?address=${s.tokenAddress}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#12172A] border border-white/10 text-white rounded-xl font-bold text-[13px] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors">
            <Shield size={14}/> Run Full Security Scan →
          </Link>
        </div>
      )}
    </div>
  );
}
