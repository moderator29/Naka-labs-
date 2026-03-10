'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { thirdwebClient, wallets } from '@/lib/thirdweb';
import {
  TrendingUp, TrendingDown, Zap, Shield, Dna, BarChart2,
  Wallet, ChevronRight, Activity, RefreshCw, Star,
} from 'lucide-react';

/* ── Quick action tiles ────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    href: '/market',
    icon: TrendingUp,
    iconColor: '#00E5FF',
    bgColor: 'rgba(0,229,255,0.08)',
    borderColor: 'rgba(0,229,255,0.15)',
    label: 'Trade',
    sub: 'Buy & sell tokens',
  },
  {
    href: '/context',
    icon: Zap,
    iconColor: '#FF6B35',
    bgColor: 'rgba(255,107,53,0.08)',
    borderColor: 'rgba(255,107,53,0.15)',
    label: 'Signals',
    sub: 'Live intelligence feed',
  },
  {
    href: '/dna-analyzer',
    icon: Dna,
    iconColor: '#9945FF',
    bgColor: 'rgba(153,69,255,0.08)',
    borderColor: 'rgba(153,69,255,0.15)',
    label: 'Analyze',
    sub: 'Wallet DNA analysis',
  },
  {
    href: '/scanner',
    icon: Shield,
    iconColor: '#FF3A80',
    bgColor: 'rgba(255,58,128,0.08)',
    borderColor: 'rgba(255,58,128,0.15)',
    label: 'Scan',
    sub: 'Token security scan',
  },
];

/* ── Static market data (refreshed on mount) ───────────── */
interface MarketItem {
  symbol: string;
  name: string;
  price: string;
  rawPrice: number;
  change: number;
  address: string;
  chain: string;
}

const DEFAULT_MARKET: MarketItem[] = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: '$66,294', rawPrice: 66294,   change: -1.14, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chain: 'ETHEREUM' },
  { symbol: 'ETH',  name: 'Ethereum', price: '$1,954',  rawPrice: 1954,    change: -2.38, address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', chain: 'ETHEREUM' },
  { symbol: 'USDT', name: 'Tether',   price: '$1.00',   rawPrice: 1,       change:  0.00, address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ETHEREUM' },
  { symbol: 'SOL',  name: 'Solana',   price: '$84.06',  rawPrice: 84.06,   change:  0.88, address: 'So11111111111111111111111111111111111111112', chain: 'SOLANA'   },
  { symbol: 'BNB',  name: 'BNB',      price: '$627.28', rawPrice: 627.28,  change:  0.50, address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', chain: 'BSC'      },
  { symbol: 'XRP',  name: 'XRP',      price: '$1.37',   rawPrice: 1.37,    change:  2.15, address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', chain: 'BSC'      },
];

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: 'rgba(11,22,38,0.8)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="text-[11px] text-[#3D5270] mb-1 uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
      {sub && <div className="text-[11px] text-[#3D5270] mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Day label ─────────────────────────────────────────── */
function getDayLabel(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date();
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function DashboardHomePage() {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const [dayLabel, setDayLabel] = useState('');
  const [market, setMarket] = useState<MarketItem[]>(DEFAULT_MARKET);
  const [marketLoading, setMarketLoading] = useState(false);
  const [signalCount, setSignalCount] = useState(24);

  useEffect(() => {
    setDayLabel(getDayLabel());
    const t = setInterval(() => setSignalCount(c => c + Math.floor(Math.random() * 2)), 8000);
    return () => clearInterval(t);
  }, []);

  async function refreshMarket() {
    setMarketLoading(true);
    try {
      const res = await fetch('/api/prices?symbols=BTC,ETH,USDT,SOL,BNB');
      const data = await res.json();
      // data is { BTC: { price, change24h }, ETH: {...}, ... }
      const updated = DEFAULT_MARKET.map(item => {
        const live = data[item.symbol];
        if (!live || !live.price) return item;
        const p = live.price;
        const formatted =
          p >= 1000 ? `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}` :
          p >= 1    ? `$${p.toFixed(2)}` :
          p >= 0.01 ? `$${p.toFixed(4)}` : `$${p.toFixed(6)}`;
        return { ...item, price: formatted, rawPrice: p, change: live.change24h ?? item.change };
      });
      setMarket(updated);
    } catch {
      // keep defaults
    } finally {
      setMarketLoading(false);
    }
  }

  useEffect(() => { refreshMarket(); }, []);

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#030912' }}>
      <div className="flex-1 px-4 pt-5 pb-24 max-w-2xl w-full mx-auto lg:max-w-3xl">

        {/* ── Welcome Header ──────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-black text-white leading-tight">
                Welcome<br />
                <span style={{ background: 'linear-gradient(135deg, #1B4FFF, #00C6FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  to Steinz Labs
                </span>
              </h1>
              <p className="text-[13px] text-[#6B84A8] mt-1.5">
                Your Web3 intelligence hub — {dayLabel}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0 mt-1"
              style={{ background: 'rgba(0,208,132,0.12)', border: '1px solid rgba(0,208,132,0.25)', color: '#00D084' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse" />
              All<br />systems<br />live
            </div>
          </div>
        </div>

        {/* ── Quick Actions 2x2 Grid ───────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          {QUICK_ACTIONS.map(({ href, icon: Icon, iconColor, bgColor, borderColor, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[0.97] hover:brightness-110"
              style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}
              >
                <Icon size={18} style={{ color: iconColor }} />
              </div>
              <div>
                <div className="text-[16px] font-bold text-white">{label}</div>
                <div className="text-[12px] text-[#6B84A8]">{sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Portfolio ────────────────────────────────── */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-black text-white">Portfolio</h2>
            <Link
              href="/portfolio"
              className="text-[12px] font-semibold flex items-center gap-0.5"
              style={{ color: '#1B4FFF' }}
            >
              View All <ChevronRight size={12} />
            </Link>
          </div>

          {account ? (
            <Link
              href="/portfolio"
              className="block rounded-2xl p-5 transition-all hover:brightness-105"
              style={{ background: 'rgba(11,22,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#3D5270] mb-1 uppercase tracking-wider">Connected</div>
                  <div className="text-[13px] font-mono text-[#6B84A8]">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#3D5270] mb-1 uppercase tracking-wider">Portfolio</div>
                  <div className="text-[18px] font-black text-white">—</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#1B4FFF' }}>
                <Wallet size={13} />
                View full portfolio →
              </div>
            </Link>
          ) : (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(11,22,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="text-[13px] text-[#3D5270] mb-4">Connect wallet to view portfolio</div>
              <button
                onClick={() => connect({ client: thirdwebClient, wallets, theme: 'dark' })}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1B4FFF, #0F3AE0)', boxShadow: '0 0 20px rgba(27,79,255,0.3)' }}
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* ── Market Overview ──────────────────────────── */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-black text-white">Market Overview</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshMarket}
                className="p-1.5 rounded-lg text-[#3D5270] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <RefreshCw size={13} className={marketLoading ? 'animate-spin' : ''} />
              </button>
              <Link
                href="/market"
                className="text-[12px] font-semibold flex items-center gap-0.5"
                style={{ color: '#1B4FFF' }}
              >
                Trade <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(11,22,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {market.map((item, i) => (
              <Link
                key={item.symbol}
                href={`/market?token=${item.address}&chain=${item.chain}`}
                className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/[0.025]"
                style={{ borderBottom: i < market.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1B4FFF44, #00C6FF22)', border: '1px solid rgba(27,79,255,0.2)' }}
                  >
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white">{item.symbol}</div>
                    <div className="text-[11px] text-[#3D5270]">{item.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold font-mono text-white">{item.price}</div>
                  <div
                    className="text-[11px] font-semibold flex items-center justify-end gap-0.5"
                    style={{ color: item.change >= 0 ? '#00D084' : '#FF3E3E' }}
                  >
                    {item.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Platform Stats ───────────────────────────── */}
        <div className="mb-7">
          <h2 className="text-[18px] font-black text-white mb-3">Platform Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Chains" value="11" sub="EVM + Solana" />
            <StatCard label="Tokens Tracked" value="500K+" sub="Across all chains" />
            <StatCard label="Signals Today" value={`${signalCount}`} sub="Live intelligence" />
            <StatCard label="Trading Volume" value="$2.4M+" sub="All-time platform" />
          </div>
        </div>

        {/* ── Explore Links ────────────────────────────── */}
        <div>
          <h2 className="text-[18px] font-black text-white mb-3">Explore</h2>
          <div className="space-y-2">
            {[
              { href: '/context',    icon: Zap,      label: 'Context Feed',   sub: 'Live AI signals & whale moves',  color: '#FF6B35' },
              { href: '/social',     icon: Activity, label: 'Social Trading', sub: 'Follow top traders',             color: '#9945FF' },
              { href: '/watchlists', icon: Star,     label: 'Watchlists',     sub: 'Track your favorite tokens',     color: '#FFD23F' },
              { href: '/vtx',        icon: BarChart2,label: 'VTX AI',         sub: 'Ask anything about crypto',      color: '#1B4FFF' },
            ].map(({ href, icon: Icon, label, sub, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all hover:brightness-105"
                style={{ background: 'rgba(11,22,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">{label}</div>
                    <div className="text-[11px] text-[#3D5270]">{sub}</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#3D5270]" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
