'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, Copy, Check,
  TrendingUp, TrendingDown, ExternalLink, QrCode, Send,
  ArrowLeftRight, History, Shield, ChevronRight, Wallet,
  Eye, EyeOff, Settings, Star, X, Search, Zap,
} from 'lucide-react';
import { formatUSD, formatPercent, formatAddress, formatNumber } from '@/lib/utils/formatters';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { thirdwebClient, wallets } from '@/lib/thirdweb';
import toast from 'react-hot-toast';

/* ── Chain colors & icons ──────────────────────────────── */
const CHAIN_META: Record<string, { label: string; color: string; short: string }> = {
  ETHEREUM: { label: 'Ethereum', color: '#627EEA', short: 'ETH' },
  SOLANA:   { label: 'Solana',   color: '#9945FF', short: 'SOL' },
  BSC:      { label: 'BNB',      color: '#F0B90B', short: 'BSC' },
  BASE:     { label: 'Base',     color: '#0052FF', short: 'BASE' },
  ARBITRUM: { label: 'Arbitrum', color: '#28A0F0', short: 'ARB' },
  POLYGON:  { label: 'Polygon',  color: '#8247E5', short: 'MATIC' },
};

/* ── Mock holdings (for display before wallet connected) ── */
const DEMO_HOLDINGS = [
  { tokenAddress: '0x1', tokenSymbol: 'ETH',   tokenName: 'Ethereum',  chain: 'ETHEREUM', priceUSD: 1978,   balance: 1.248,   valueUSD: 2468.54, change24h: -4.3,  logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { tokenAddress: '0x2', tokenSymbol: 'SOL',   tokenName: 'Solana',    chain: 'SOLANA',   priceUSD: 84.06,  balance: 12.8,    valueUSD: 1075.97, change24h: 0.88,  logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { tokenAddress: '0x3', tokenSymbol: 'USDC',  tokenName: 'USD Coin',  chain: 'ETHEREUM', priceUSD: 1.0,    balance: 842.5,   valueUSD: 842.50,  change24h: 0.01,  logoUrl: '' },
  { tokenAddress: '0x4', tokenSymbol: 'DEGEN', tokenName: 'Degen',     chain: 'BASE',     priceUSD: 0.0082, balance: 48_200,  valueUSD: 395.24,  change24h: 12.4,  logoUrl: '' },
  { tokenAddress: '0x5', tokenSymbol: 'WIF',   tokenName: 'dogwifhat', chain: 'SOLANA',   priceUSD: 1.24,   balance: 248.5,   valueUSD: 308.14,  change24h: -5.2,  logoUrl: 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.png' },
];

/* ── Address copy ──────────────────────────────────────── */
function AddressCopy({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B84A8] hover:text-white transition-colors">
      {formatAddress(address, 8)}
      {copied ? <Check size={11} className="text-[#00D084]" /> : <Copy size={11} />}
    </button>
  );
}

/* ── Token Icon ────────────────────────────────────────── */
function TokenIcon({ symbol, logoUrl, size = 40 }: { symbol: string; logoUrl?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const colors: Record<string, string> = {
    ETH: '#627EEA', SOL: '#9945FF', BTC: '#F7931A', BNB: '#F0B90B',
    USDC: '#2775CA', USDT: '#26A17B', DEGEN: '#A855F7', WIF: '#E17C29', BONK: '#E27C2D',
  };
  const bg = colors[symbol] ?? '#1B4FFF';
  if (logoUrl && !err) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0 border-2 border-white/[0.06]"
        style={{ width: size, height: size, background: `${bg}20` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={symbol} width={size} height={size}
          className="w-full h-full object-cover" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-black text-white border-2 border-white/[0.06]"
      style={{ width: size, height: size, fontSize: size * 0.3, background: `linear-gradient(135deg, ${bg}, ${bg}88)` }}>
      {symbol.slice(0, 2)}
    </div>
  );
}

/* ── Allocation Donut ──────────────────────────────────── */
function AllocationDonut({ holdings }: { holdings: Array<{ tokenSymbol: string; valueUSD: number; logoUrl?: string }> }) {
  const total = holdings.reduce((s, h) => s + h.valueUSD, 0);
  if (total === 0) return null;

  const colors = ['#1B4FFF', '#9945FF', '#00D084', '#FF6B35', '#FFD23F', '#FF3E3E', '#00C6FF', '#A855F7'];
  let cumPct = 0;
  const slices = holdings.slice(0, 6).map((h, i) => {
    const pct = (h.valueUSD / total) * 100;
    const start = cumPct;
    cumPct += pct;
    return { ...h, pct, start, color: colors[i] };
  });

  const r = 48;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  function describeArc(startPct: number, pct: number) {
    const startAngle = (startPct / 100) * 360 - 90;
    const endAngle = ((startPct + pct) / 100) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = pct > 50 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={describeArc(s.start, s.pct)} fill={s.color} opacity="0.85" />
        ))}
        {/* Center hole */}
        <circle cx={cx} cy={cy} r={32} fill="#0D1A2B" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-[8px] font-bold" style={{ fontSize: 9, fill: '#EEF2FF', fontWeight: 800 }}>
          {holdings.length}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 7, fill: '#3D5270' }}>
          tokens
        </text>
      </svg>
      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-[#6B84A8] w-10 font-semibold">{s.tokenSymbol}</span>
            <span className="text-[11px] font-bold text-[#EEF2FF]">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Send Modal ────────────────────────────────────────── */
function SendModal({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0D1A2B] border border-white/[0.07] rounded-3xl p-6"
        onClick={e => e.stopPropagation()} style={{ animation: 'fadeInScale 0.2s ease-out' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-black text-white">Send</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-[#3D5270] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">Token</div>
            <select value={token} onChange={e => setToken(e.target.value)}
              className="w-full bg-[#07101F] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#1B4FFF]/40 transition-colors appearance-none cursor-pointer">
              {DEMO_HOLDINGS.map(h => <option key={h.tokenSymbol} value={h.tokenSymbol}>{h.tokenSymbol} — {formatUSD(h.valueUSD)}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">To Address</div>
            <input value={recipient} onChange={e => setRecipient(e.target.value)}
              placeholder="0x... or wallet.eth"
              className="w-full bg-[#07101F] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/40 transition-colors" />
          </div>
          <div>
            <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">Amount</div>
            <div className="relative">
              <input value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" type="number"
                className="w-full bg-[#07101F] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/40 transition-colors pr-16" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1B4FFF] font-bold bg-[#1B4FFF]/15 px-2 py-1 rounded-lg">MAX</button>
            </div>
          </div>
          <button
            onClick={() => { toast.success('Connect wallet to send'); onClose(); }}
            className="w-full py-4 rounded-2xl font-black text-[15px] btn-primary">
            Review Send
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Receive Modal ─────────────────────────────────────── */
function ReceiveModal({ address, onClose }: { address: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs bg-[#0D1A2B] border border-white/[0.07] rounded-3xl p-6 text-center"
        onClick={e => e.stopPropagation()} style={{ animation: 'fadeInScale 0.2s ease-out' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-black text-white">Receive</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-[#3D5270] hover:text-white transition-colors"><X size={14} /></button>
        </div>
        {/* QR code placeholder */}
        <div className="w-48 h-48 mx-auto bg-white rounded-2xl mb-4 flex items-center justify-center p-3">
          <div className="w-full h-full grid grid-cols-7 gap-0.5">
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} className="rounded-sm" style={{
                background: Math.random() > 0.4 ? '#000' : '#fff',
                aspectRatio: '1',
              }} />
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[#3D5270] mb-3">Scan QR code or copy address below</p>
        <div className="flex items-center gap-2 bg-[#07101F] border border-white/[0.07] rounded-xl px-3 py-2.5 mb-4">
          <span className="text-[11px] font-mono text-[#EEF2FF] flex-1 truncate">{address}</span>
          <button onClick={copy} className={`flex-shrink-0 transition-colors ${copied ? 'text-[#00D084]' : 'text-[#3D5270] hover:text-white'}`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        <p className="text-[10px] text-[#3D5270]">Only send assets on the same chain</p>
      </div>
    </div>
  );
}

/* ── Main Portfolio/Wallet Page ─────────────────────────── */
export default function PortfolioPage() {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const authenticated = !!account;
  const walletAddress = account?.address ?? '';

  const { holdings, totalValue, unrealizedPL, setHoldings, setLoading, isLoading } = usePortfolioStore();

  const [hideBalance, setHideBalance]   = useState(false);
  const [activeSection, setActiveSection] = useState<'assets' | 'history' | 'nfts'>('assets');
  const [sortBy, setSortBy]             = useState<'value' | 'change' | 'balance'>('value');
  const [showSend, setShowSend]         = useState(false);
  const [showReceive, setShowReceive]   = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [trackedWallets, setTrackedWallets] = useState<string[]>([]);
  const [watchAddress, setWatchAddress] = useState('');
  const [showAddWatch, setShowAddWatch] = useState(false);

  // Display holdings: use real from store or demo
  const displayHoldings = holdings.length > 0 ? holdings : (authenticated ? [] : DEMO_HOLDINGS);

  const fetchPortfolio = useCallback(async (addr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio?address=${addr}`);
      const data = await res.json();
      if (data.holdings?.length) setHoldings(data.holdings);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [setHoldings, setLoading]);

  useEffect(() => {
    if (account?.address) {
      setTrackedWallets([account.address]);
      fetchPortfolio(account.address);
    }
  }, [account?.address, fetchPortfolio]);

  function addWatchWallet() {
    const addr = watchAddress.trim();
    if (!addr || trackedWallets.includes(addr)) return;
    setTrackedWallets(p => [...p, addr]);
    setWatchAddress('');
    setShowAddWatch(false);
    fetchPortfolio(addr);
    toast.success('Watch wallet added!');
  }

  const totalVal = authenticated
    ? (displayHoldings.reduce((s, h) => s + (h.valueUSD ?? 0), 0))
    : 5089.39; // demo

  const totalPL = displayHoldings.reduce((s, h) => {
    const costBasis = 'costBasis' in h ? (h as {costBasis?: number}).costBasis ?? 0 : 0;
    return s + ((h.valueUSD ?? 0) - costBasis);
  }, 0);

  const sortedHoldings = [...displayHoldings]
    .filter(h => !searchQ || h.tokenSymbol.toLowerCase().includes(searchQ.toLowerCase()) || h.tokenName?.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'value')  return (b.valueUSD ?? 0) - (a.valueUSD ?? 0);
      if (sortBy === 'change') return (b.change24h ?? 0) - (a.change24h ?? 0);
      return (b.balance ?? 0) - (a.balance ?? 0);
    });

  /* ── Not connected state ─────────────────────────────── */
  if (!authenticated) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12" style={{ background: '#030912' }}>
        {/* Hero icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1B4FFF, #00C6FF)', boxShadow: '0 0 48px rgba(27,79,255,0.4)' }}>
            <Wallet size={44} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#00D084] flex items-center justify-center">
            <Shield size={14} className="text-black" />
          </div>
        </div>

        <h1 className="text-[28px] font-black text-white mb-3 text-center">Your Web3 Wallet</h1>
        <p className="text-[#6B84A8] text-[14px] text-center max-w-xs mb-8 leading-relaxed">
          Non-custodial. Multi-chain. Connect MetaMask, Trust Wallet, or any Web3 wallet.
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-10">
          {[
            { icon: '🔒', label: 'Non-Custodial', desc: 'Your keys, your crypto' },
            { icon: '⛓️', label: 'Multi-Chain', desc: '11 chains supported' },
            { icon: '📊', label: 'Real-time P&L', desc: 'Live portfolio tracking' },
          ].map(f => (
            <div key={f.label} className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-3 text-center">
              <div className="text-[22px] mb-1">{f.icon}</div>
              <div className="text-[11px] font-bold text-[#EEF2FF] mb-0.5">{f.label}</div>
              <div className="text-[9px] text-[#3D5270]">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Connect */}
        <button onClick={() => connect({ client: thirdwebClient, wallets, theme: 'dark' })}
          className="w-full max-w-sm py-4 rounded-2xl font-black text-[16px] btn-primary mb-4 flex items-center justify-center gap-2">
          <Wallet size={18} />
          Connect Wallet
        </button>

        {/* Watch wallet */}
        <button onClick={() => setShowAddWatch(p => !p)}
          className="flex items-center gap-2 text-[13px] text-[#3D5270] hover:text-[#6B84A8] transition-colors">
          <Eye size={14} />
          Watch any wallet address
        </button>

        {showAddWatch && (
          <div className="mt-4 w-full max-w-sm flex gap-2">
            <input value={watchAddress} onChange={e => setWatchAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWatchWallet()}
              placeholder="0x... or Solana address"
              className="flex-1 bg-[#0D1A2B] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/40 transition-colors" />
            <button onClick={addWatchWallet}
              className="px-4 py-3 rounded-xl bg-[#1B4FFF] text-white text-[12px] font-bold hover:bg-[#2560FF] transition-colors">
              Watch
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Connected state ─────────────────────────────────── */
  return (
    <div className="min-h-full flex flex-col" style={{ background: '#030912' }}>

      {/* ── Hero balance card ────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <div className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0F1E35 0%, #1a2d4a 50%, #0D1A2B 100%)', border: '1px solid rgba(27,79,255,0.2)' }}>
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(27,79,255,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

          {/* Wallet info */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF]" />
              <div>
                <div className="text-[11px] text-[#6B84A8]">Connected Wallet</div>
                <AddressCopy address={walletAddress} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHideBalance(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-[#6B84A8] hover:text-white transition-colors">
                {hideBalance ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button onClick={() => account?.address && fetchPortfolio(account.address)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.06] text-[#6B84A8] hover:text-white transition-colors">
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-5">
            <div className="text-[11px] text-[#6B84A8] mb-1">Total Balance</div>
            <div className="text-[38px] font-black font-mono text-white leading-none">
              {hideBalance ? '••••••' : formatUSD(totalVal)}
            </div>
            <div className={`flex items-center gap-1.5 mt-2 text-[13px] font-bold ${totalPL >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
              {totalPL >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {totalPL >= 0 ? '+' : ''}{formatUSD(Math.abs(totalPL))} all time
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Send,          label: 'Send',    onClick: () => setShowSend(true),    color: '#1B4FFF' },
              { icon: ArrowDownLeft, label: 'Receive', onClick: () => setShowReceive(true), color: '#00D084' },
              { icon: ArrowLeftRight,label: 'Swap',    onClick: () => {},                   color: '#A855F7', href: '/market' },
              { icon: History,       label: 'History', onClick: () => setActiveSection('history'), color: '#FF6B35' },
            ].map(({ icon: Icon, label, onClick, color, href }) => {
              const Comp = href ? 'a' : 'button';
              return (
                <Comp key={label} onClick={onClick} {...(href ? { href } : {})}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all hover:scale-105 border border-white/[0.06]"
                  style={{ background: `${color}15` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                </Comp>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Multi-wallet tabs ─────────────────────────────── */}
      {trackedWallets.length > 1 && (
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-2">
          {trackedWallets.map(w => (
            <button key={w} onClick={() => fetchPortfolio(w)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-mono border border-white/[0.07] bg-white/[0.04] text-[#6B84A8] hover:text-white hover:border-[#1B4FFF]/30 transition-all whitespace-nowrap flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF] flex-shrink-0" />
              {formatAddress(w, 4)}
            </button>
          ))}
          <button onClick={() => setShowAddWatch(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] border border-dashed border-white/10 text-[#3D5270] hover:border-[#1B4FFF]/30 hover:text-[#1B4FFF] transition-all flex-shrink-0 whitespace-nowrap">
            <Plus size={11} /> Add Wallet
          </button>
        </div>
      )}

      {/* ── Allocation chart ──────────────────────────────── */}
      {displayHoldings.length > 0 && (
        <div className="mx-4 mb-4 bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-5">
          <div className="text-[11px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-4">Allocation</div>
          <AllocationDonut holdings={displayHoldings} />
        </div>
      )}

      {/* ── Section tabs ─────────────────────────────────── */}
      <div className="flex border-b border-white/[0.05] mx-4 mb-0">
        {(['assets', 'history', 'nfts'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`flex-1 py-2.5 text-[12px] font-bold capitalize border-b-2 transition-all ${
              activeSection === s ? 'border-[#1B4FFF] text-white' : 'border-transparent text-[#3D5270] hover:text-[#6B84A8]'
            }`}>
            {s === 'nfts' ? 'NFTs' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Assets section ───────────────────────────────── */}
      {activeSection === 'assets' && (
        <div className="px-4 pt-4 flex-1">
          {/* Search + sort */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D5270]" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-[#0D1A2B] border border-white/[0.06] rounded-xl pl-8 pr-4 py-2 text-[12px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/30 transition-colors" />
            </div>
            {(['value', 'change', 'balance'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold capitalize transition-all ${sortBy === s ? 'bg-[#1B4FFF]/15 text-[#7BA4FF] border border-[#1B4FFF]/25' : 'text-[#3D5270] hover:text-[#6B84A8] border border-white/[0.06]'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Holdings list */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
            </div>
          ) : sortedHoldings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Wallet size={40} className="text-[#3D5270] mb-4" />
              <div className="text-[#3D5270] text-[13px]">No tokens found</div>
              <div className="text-[#3D5270] text-[11px] mt-1">Your portfolio will appear here</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHoldings.map(h => {
                const chain = CHAIN_META[h.chain] ?? { label: h.chain, color: '#6B84A8', short: h.chain };
                const change = h.change24h ?? 0;
                const pct = (h.valueUSD ?? 0) / Math.max(totalVal, 1) * 100;
                return (
                  <Link key={h.tokenAddress} href={`/market?token=${h.tokenAddress}&chain=${h.chain}`}
                    className="flex items-center gap-4 p-4 bg-[#0D1A2B] border border-white/[0.06] rounded-2xl hover:border-[#1B4FFF]/25 hover:bg-[#0F1E35] transition-all group">
                    <TokenIcon symbol={h.tokenSymbol} logoUrl={(h as {logoUrl?: string}).logoUrl} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-bold text-[#EEF2FF]">{h.tokenSymbol}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg"
                          style={{ background: `${chain.color}20`, color: chain.color }}>
                          {chain.short}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#3D5270]">{h.tokenName ?? h.tokenSymbol}</div>
                      {/* Allocation bar */}
                      <div className="h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden w-24">
                        <div className="h-full bg-[#1B4FFF] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[14px] font-bold font-mono text-[#EEF2FF] mb-0.5">
                        {formatUSD(h.valueUSD ?? 0)}
                      </div>
                      <div className="text-[11px] font-mono text-[#3D5270] mb-0.5">
                        {formatNumber(h.balance ?? 0)} {h.tokenSymbol}
                      </div>
                      <div className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${change >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                        {change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {formatPercent(change)}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#3D5270] group-hover:text-[#1B4FFF] transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Add watch wallet */}
          <div className="mt-4">
            {showAddWatch ? (
              <div className="flex gap-2">
                <input value={watchAddress} onChange={e => setWatchAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWatchWallet()}
                  placeholder="Add wallet address to watch (EVM or Solana)"
                  className="flex-1 bg-[#0D1A2B] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/40 transition-colors" />
                <button onClick={addWatchWallet}
                  className="px-4 py-3 rounded-xl bg-[#1B4FFF] text-white text-[12px] font-bold hover:bg-[#2560FF] transition-colors flex items-center gap-1.5">
                  <Eye size={12} /> Watch
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAddWatch(true)}
                className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-[12px] text-[#3D5270] hover:border-[#1B4FFF]/30 hover:text-[#1B4FFF] transition-all flex items-center justify-center gap-2">
                <Plus size={13} /> Watch Another Wallet
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[
              { href: '/dna-analyzer', icon: Zap, label: 'DNA Analysis', desc: 'Decode wallet behavior', color: '#A855F7' },
              { href: '/scanner', icon: Shield, label: 'Token Security', desc: 'Scan before you trade', color: '#FF6B35' },
              { href: '/watchlists', icon: Star, label: 'Watchlists', desc: 'Track your favorites', color: '#FFD23F' },
              { href: '/alerts', icon: Settings, label: 'Price Alerts', desc: 'Never miss a move', color: '#1B4FFF' },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-4 bg-[#0D1A2B] border border-white/[0.06] rounded-2xl hover:border-[#1B4FFF]/25 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[#EEF2FF]">{label}</div>
                  <div className="text-[10px] text-[#3D5270]">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── History section ───────────────────────────────── */}
      {activeSection === 'history' && (
        <div className="px-4 pt-4 flex-1">
          <div className="flex flex-col items-center justify-center py-20">
            <History size={40} className="text-[#3D5270] mb-4" />
            <div className="text-[#6B84A8] text-[13px] mb-2 font-semibold">Transaction History</div>
            <div className="text-[#3D5270] text-[12px]">Connect wallet to view your transaction history</div>
          </div>
        </div>
      )}

      {/* ── NFTs section ──────────────────────────────────── */}
      {activeSection === 'nfts' && (
        <div className="px-4 pt-4 flex-1">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-[40px] mb-4">🎨</div>
            <div className="text-[#6B84A8] text-[13px] mb-2 font-semibold">NFT Gallery</div>
            <div className="text-[#3D5270] text-[12px]">NFT display coming soon</div>
          </div>
        </div>
      )}

      {/* Spacing */}
      <div className="h-24" />

      {/* Modals */}
      {showSend    && <SendModal onClose={() => setShowSend(false)} />}
      {showReceive && <ReceiveModal address={walletAddress} onClose={() => setShowReceive(false)} />}
    </div>
  );
}
