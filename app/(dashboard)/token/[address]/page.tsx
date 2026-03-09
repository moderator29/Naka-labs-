'use client';

import { useState, useEffect, useCallback, use } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Star, ExternalLink, Shield, Zap, Activity,
  ArrowUpDown, RefreshCw, Wallet, ChevronDown, Info,
  TrendingUp, TrendingDown, Copy, Check, Layers, BarChart2,
  Twitter, Globe, BookOpen, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

/* ── Dynamic chart/bubblemap ────────────────────────────── */
const TradingChart = dynamic(() => import('@/components/trading/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#050E1A' }}>
      <div className="w-8 h-8 border-2 border-[#1B4FFF] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
const BubbleMap = dynamic(() => import('@/components/trading/BubbleMap'), { ssr: false });

/* ── Types ─────────────────────────────────────────────── */
interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h?: number;
  change6h?: number;
  volume24h: number;
  volume5m?: number;
  liquidity: number;
  marketCap: number;
  fdv?: number;
  supply?: number;
  holders?: number;
  age?: string;
  chain: string;
  chainId?: string;
  pairAddress?: string;
  rank?: number;
  ath?: number;
  athBelow?: number;
  circulating?: number;
  circulatingMax?: number;
  fundingRate?: number;
  openInterest?: number;
  perpVolume24h?: number;
  coingeckoId?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
  logoUrl?: string;
  isMajor?: boolean;
  buys24h?: number;
  sells24h?: number;
}

/* ── Token icon map ─────────────────────────────────────── */
const TOKEN_ICONS: Record<string, string> = {
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  WIF:  'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.png',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  HYPE: 'https://assets.coingecko.com/coins/images/53973/small/hyperliquid.png',
};

const TOKEN_DB: Record<string, TokenData> = {
  bitcoin: {
    address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', symbol: 'BTC', name: 'Bitcoin',
    price: 67_240, change24h: 2.4, change1h: 0.32, change6h: 1.1,
    volume24h: 44_570_000_000, volume5m: 180_000_000, liquidity: 2_000_000_000,
    marketCap: 1_350_000_000_000, fdv: 1_350_000_000_000,
    supply: 21_000_000, circulating: 19_700_000, circulatingMax: 95.2,
    holders: 50_000_000, rank: 1, ath: 126_080, athBelow: 46.5,
    fundingRate: -0.1101, openInterest: 57_680_000_000, perpVolume24h: 242_810_000_000,
    chain: 'ETHEREUM', chainId: '1', isMajor: true,
    website: 'https://bitcoin.org', twitter: 'https://twitter.com/bitcoin',
    description: 'Bitcoin is the first cryptocurrency, a decentralized digital currency without a central bank.',
  },
  ethereum: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'ETH', name: 'Ethereum',
    price: 1_978, change24h: -4.3, change1h: -0.16, change6h: -2.1,
    volume24h: 14_200_000_000, volume5m: 90_000_000, liquidity: 800_000_000,
    marketCap: 238_000_000_000, fdv: 238_000_000_000,
    supply: 120_400_000, circulating: 120_400_000, circulatingMax: 100,
    holders: 100_000_000, rank: 2, ath: 4_878, athBelow: 59.5,
    fundingRate: -0.0432, openInterest: 12_400_000_000, perpVolume24h: 88_200_000_000,
    chain: 'ETHEREUM', chainId: '1', isMajor: true,
    website: 'https://ethereum.org', twitter: 'https://twitter.com/ethereum',
    description: 'Ethereum is a decentralized smart contract platform powering DeFi, NFTs, and Web3.',
  },
  solana: {
    address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana',
    price: 84.06, change24h: 0.88, change1h: -0.24, change6h: 0.64,
    volume24h: 4_100_000_000, volume5m: 62_480_000, liquidity: 200_000_000,
    marketCap: 38_000_000_000, fdv: 42_000_000_000,
    supply: 590_000_000, circulating: 453_000_000, circulatingMax: 76.7,
    holders: 8_400_000, rank: 5, ath: 260, athBelow: 67.7,
    fundingRate: 0.0120, openInterest: 3_200_000_000, perpVolume24h: 18_500_000_000,
    chain: 'SOLANA', chainId: '0', isMajor: true,
    website: 'https://solana.com', twitter: 'https://twitter.com/solana',
    description: 'Solana is a high-performance blockchain supporting builders around the world.',
  },
};

const PERP_EXCHANGES = ['All', 'Binance', 'OKX', 'Bybit', 'Coinbase', 'Hyperliquid'];

/* ── Formatters ─────────────────────────────────────────── */
function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`;
  if (n < 0.000001) return `$${n.toFixed(10)}`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01)  return `$${n.toFixed(6)}`;
  if (n < 1)     return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
function fmtNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtPct(n: number, sign = true): string {
  return `${sign && n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

const TIMEFRAMES = ['1H', '6H', '1D', '1W', '1M', '1Y', 'ALL'];

/* ── Token Icon Component ────────────────────────────────── */
function TokenIcon({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const [err, setErr] = useState(false);
  const src = TOKEN_ICONS[symbol];
  if (src && !err) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size }}>
        <Image src={src} alt={symbol} width={size} height={size} className="w-full h-full object-cover" onError={() => setErr(true)} unoptimized />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.3, background: 'linear-gradient(135deg, #1B4FFF, #00C6FF)' }}>
      {symbol.slice(0, 2)}
    </div>
  );
}

/* ── Chain Badge ─────────────────────────────────────────── */
function ChainBadge({ chain }: { chain: string }) {
  const colors: Record<string, string> = {
    SOLANA: '#9945FF', ETHEREUM: '#627EEA', BSC: '#F0B90B',
    BASE: '#0052FF', ARBITRUM: '#12AAFF', POLYGON: '#8247E5',
  };
  const c = colors[chain] || '#1B4FFF';
  return (
    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
      style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}>
      {chain === 'ETHEREUM' ? 'ETH' : chain.slice(0, 4)}
    </span>
  );
}

/* ── Mobile Buy/Sell Sheet ─────────────────────────────── */
function BuySellSheet({ side, token, onClose }: { side: 'buy' | 'sell'; token: TokenData; onClose: () => void }) {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const [amount, setAmount] = useState('0');
  const [pct, setPct] = useState(0);
  const [isUSD, setIsUSD] = useState(true);
  const [executing, setExecuting] = useState(false);

  const available = 0; // from wallet
  const isBuy = side === 'buy';
  const accentColor = isBuy ? '#00D084' : '#FF3E3E';

  function appendDigit(d: string) {
    if (d === '⌫') { setAmount(p => p.length > 1 ? p.slice(0, -1) : '0'); return; }
    if (d === '.' && amount.includes('.')) return;
    if (amount === '0' && d !== '.') setAmount(d);
    else if (amount.length < 12) setAmount(p => p + d);
  }

  function applyPct(p: number) {
    setPct(p);
    setAmount(p === 0 ? '0' : (available * p / 100).toFixed(2));
  }

  async function execute() {
    if (!account) { connect({ client: thirdwebClient, wallets, theme: 'dark' }); return; }
    const v = parseFloat(amount);
    if (!v || v <= 0) { toast.error('Enter a valid amount'); return; }
    setExecuting(true);
    await new Promise(r => setTimeout(r, 1400));
    toast.success(`${isBuy ? '🟢 Bought' : '🔴 Sold'} — $${amount} of ${token.symbol}`);
    setExecuting(false);
    onClose();
  }

  const numpad = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-white/10 px-5 pt-3 pb-8"
        style={{ background: '#0A1525', animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <TokenIcon symbol={token.symbol} size={32} />
            <span className="text-[20px] font-black" style={{ color: accentColor }}>
              {isBuy ? 'Buy' : 'Sell'} {token.symbol}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition-colors">
            <X size={15} className="text-white/50" />
          </button>
        </div>

        {/* Amount display */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className={`text-[48px] font-black font-mono tracking-tight leading-none ${amount === '0' ? 'text-white/20' : 'text-white'}`}>
            {isUSD ? `$${amount}` : amount}
          </span>
          <button onClick={() => setIsUSD(p => !p)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/6 hover:bg-white/12 transition-colors">
            <ArrowUpDown size={16} className="text-white/50" />
          </button>
        </div>

        {/* Slider */}
        <div className="mb-1.5 px-1">
          <input type="range" min={0} max={100} step={1} value={pct}
            onChange={e => applyPct(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor }} />
        </div>
        <div className="flex justify-between px-1 mb-4">
          {[0,25,50,75].map(p => (
            <button key={p} onClick={() => applyPct(p)}
              className={`text-[11px] font-bold transition-colors ${pct === p ? 'text-white' : 'text-white/25 hover:text-white/50'}`}>
              {p}%
            </button>
          ))}
          <button onClick={() => applyPct(100)}
            className={`text-[11px] font-bold transition-colors ${pct === 100 ? 'text-white' : 'text-white/25 hover:text-white/50'}`}>
            MAX
          </button>
        </div>

        {/* Available */}
        <div className="flex justify-between text-[12px] mb-4 px-1">
          <span className="text-white/30">Available</span>
          <span className="text-white/50 font-mono">${available.toFixed(2)}</span>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {numpad.map(key => (
            <button key={key} onClick={() => appendDigit(key)}
              className="py-[15px] text-[20px] font-semibold text-white bg-white/[0.04] rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] active:scale-95 transition-all">
              {key === '⌫' ? (
                <span className="flex items-center justify-center">
                  <svg width="20" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 1H8L1 8l7 7h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" />
                    <line x1="16" y1="5" x2="11" y2="10" /><line x1="11" y1="5" x2="16" y2="10" />
                  </svg>
                </span>
              ) : key}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <button onClick={execute} disabled={executing}
            className="flex-1 py-4 rounded-2xl font-black text-[16px] transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: account
                ? isBuy ? 'linear-gradient(135deg,#00D084,#00A867)' : 'linear-gradient(135deg,#FF3E3E,#CC3030)'
                : 'linear-gradient(135deg,#00D084,#00A867)',
              color: account ? (isBuy ? '#000' : '#fff') : '#000',
              boxShadow: `0 0 24px ${accentColor}40`,
            }}>
            {executing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Executing...
              </span>
            ) : !account ? (
              <span className="flex items-center justify-center gap-2">
                <Wallet size={16} /> Connect Wallet
              </span>
            ) : `${isBuy ? 'Buy' : 'Sell'} ${token.symbol}`}
          </button>
          {/* Checkprice-style swap side toggle button */}
          <button
            onClick={onClose}
            className="w-14 flex items-center justify-center rounded-2xl transition-all active:scale-95"
            style={{ background: '#FF6B35', color: '#fff' }}>
            <ArrowUpDown size={20} />
          </button>
        </div>
        <p className="text-center text-[11px] text-white/20 mt-3">0.1% fee</p>
      </div>
    </div>
  );
}

/* ── Key Stats Grid ─────────────────────────────────────── */
function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="stats-grid-item">
      <div className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="text-[16px] font-black font-mono leading-tight" style={{ color: color ?? '#EEF2FF' }}>{value}</div>
      {sub && <div className="text-[10px] text-[#3D5270] mt-1">{sub}</div>}
    </div>
  );
}

/* ── Progress Bar ───────────────────────────────────────── */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1 bg-white/8 rounded-full overflow-hidden mt-1.5">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
    </div>
  );
}

/* ── Address Copy ───────────────────────────────────────── */
function AddressCopy({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const short = address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-[11px] font-mono text-[#3D5270] hover:text-[#6B84A8] transition-colors">
      {short}
      {copied ? <Check size={10} className="text-[#00D084]" /> : <Copy size={10} />}
    </button>
  );
}

/* ── Main Token Page ─────────────────────────────────────── */
export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const searchParams = useSearchParams();
  const chain = searchParams.get('chain') ?? 'ETHEREUM';
  const account = useActiveAccount();

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1D');
  const [chartView, setChartView] = useState<'chart' | 'bubblemap'>('chart');
  const [favorite, setFavorite] = useState(false);
  const [buySide, setBuySide] = useState<'buy' | 'sell' | null>(null);
  const [selectedExchange, setSelectedExchange] = useState('All');
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'perps' | 'social'>('overview');

  /* Load token data */
  const fetchToken = useCallback(async () => {
    setLoading(true);
    try {
      // Try our known tokens first
      const known = TOKEN_DB[address.toLowerCase()];
      if (known) {
        setToken(known);
        setLoading(false);
        return;
      }

      // Try API
      const res = await fetch(`/api/market/chart?type=token&address=${address}&chain=${chain}`);
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      } else {
        // Fallback: build from address
        setToken({
          address,
          symbol: address.slice(0, 4).toUpperCase(),
          name: 'Unknown Token',
          price: 0, change24h: 0, volume24h: 0, liquidity: 0,
          marketCap: 0, chain,
        });
      }
    } catch {
      setToken({
        address, symbol: address.slice(0, 4).toUpperCase(), name: 'Token',
        price: 0, change24h: 0, volume24h: 0, liquidity: 0, marketCap: 0, chain,
      });
    } finally {
      setLoading(false);
    }
  }, [address, chain]);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  // Check favorites
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('sl-favorites') ?? '[]') as string[];
    setFavorite(favs.includes(address));
  }, [address]);

  function toggleFavorite() {
    const favs = JSON.parse(localStorage.getItem('sl-favorites') ?? '[]') as string[];
    let next: string[];
    if (favorite) {
      next = favs.filter((f: string) => f !== address);
      toast('Removed from favorites');
    } else {
      next = [...favs, address];
      toast.success('Added to favorites ⭐');
    }
    localStorage.setItem('sl-favorites', JSON.stringify(next));
    setFavorite(!favorite);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#030912] items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#1B4FFF] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#3D5270] text-[13px]">Loading token data...</div>
      </div>
    );
  }

  if (!token) return null;

  const isPositive = token.change24h >= 0;
  const priceColor = isPositive ? '#00D084' : '#FF3E3E';

  // Approximate token value from chart data
  const tradingToken = {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    price: token.price,
    change24h: token.change24h,
    volume24h: token.volume24h,
    liquidity: token.liquidity,
    marketCap: token.marketCap,
    chain: token.chain,
    chainId: token.chainId ?? '1',
    pairAddress: token.pairAddress ?? '',
  };

  return (
    <div className="flex flex-col h-full bg-[#030912] overflow-hidden">
      {/* ── Top Header Bar ──────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/[0.06]" style={{ background: '#07101F' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back */}
          <Link href="/market" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#6B84A8] hover:text-white transition-all flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>

          {/* Token identity */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TokenIcon symbol={token.symbol} size={38} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[16px] font-black text-white leading-tight">{token.name}</span>
                <span className="text-[12px] text-[#6B84A8] font-bold">{token.symbol}</span>
                <ChainBadge chain={token.chain} />
                {token.rank && (
                  <span className="text-[10px] bg-[#1B4FFF]/15 text-[#7BA4FF] border border-[#1B4FFF]/30 px-1.5 py-0.5 rounded-lg font-bold">
                    #{token.rank}
                  </span>
                )}
              </div>
              <AddressCopy address={token.address} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {token.twitter && (
              <a href={token.twitter} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-[#3D5270] hover:text-[#1DA1F2] transition-all">
                <Twitter size={13} />
              </a>
            )}
            {token.website && (
              <a href={token.website} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-[#3D5270] hover:text-white transition-all">
                <Globe size={13} />
              </a>
            )}
            <Link href={`/scanner?address=${token.address}&chain=${token.chain}`}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-[#3D5270] hover:text-[#A855F7] transition-all"
              title="Scan token">
              <Shield size={13} />
            </Link>
            <Link href={`/context?token=${token.address}`}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-[#3D5270] hover:text-[#00C6FF] transition-all"
              title="View signals">
              <Zap size={13} />
            </Link>
            <button onClick={toggleFavorite}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${
                favorite
                  ? 'bg-[#FFD23F]/15 border-[#FFD23F]/30 text-[#FFD23F]'
                  : 'bg-white/[0.04] border-white/[0.07] text-[#3D5270] hover:text-[#FFD23F]'
              }`}>
              <Star size={13} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-end gap-4 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div>
            <div className="text-[28px] font-black font-mono text-white leading-none">{fmt(token.price)}</div>
            <div className="flex items-center gap-2 mt-1">
              {isPositive ? <TrendingUp size={13} style={{ color: priceColor }} /> : <TrendingDown size={13} style={{ color: priceColor }} />}
              <span className="text-[13px] font-bold" style={{ color: priceColor }}>
                {fmtPct(token.change24h)} (24h)
              </span>
            </div>
          </div>
          {/* Mini chips */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] pb-1">
            {token.change1h !== undefined && (
              <div>
                <span className="text-[#3D5270]">1H </span>
                <span className={token.change1h >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}>{fmtPct(token.change1h)}</span>
              </div>
            )}
            {token.volume24h > 0 && (
              <div><span className="text-[#3D5270]">Vol </span><span className="text-[#EEF2FF]">{fmt(token.volume24h)}</span></div>
            )}
            {token.marketCap > 0 && (
              <div><span className="text-[#3D5270]">MCap </span><span className="text-[#EEF2FF]">{fmt(token.marketCap)}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── CENTER: Chart + Stats ─────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">

          {/* Chart view toggle */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] flex-shrink-0" style={{ background: '#07101F' }}>
            {([
              { id: 'chart', label: 'Chart', icon: TrendingUp },
              { id: 'bubblemap', label: 'Bubble Map', icon: Layers },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setChartView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  chartView === id
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-[#3D5270] hover:text-[#6B84A8] hover:bg-white/[0.04]'
                }`}>
                <Icon size={11} /> {label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              {/* Crosshair / settings icon */}
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3D5270] hover:text-white hover:bg-white/[0.05] transition-colors">
                <BarChart2 size={13} />
              </button>
            </div>
          </div>

          {/* Chart area */}
          <div className="flex-shrink-0" style={{ height: 'clamp(300px, 42vh, 420px)' }}>
            {chartView === 'chart' ? (
              <TradingChart token={tradingToken} onPriceClick={() => {}} />
            ) : (
              <div className="w-full h-full overflow-auto p-3">
                <BubbleMap tokenSymbol={token.symbol} tokenAddress={token.address} chain={token.chain} />
              </div>
            )}
          </div>

          {/* Timeframes */}
          <div className="flex items-center justify-center gap-0 px-4 py-3 border-b border-white/[0.05] flex-shrink-0" style={{ background: '#07101F' }}>
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-xl transition-all ${
                  timeframe === tf
                    ? 'bg-white/12 text-white border border-white/15'
                    : 'text-[#3D5270] hover:text-[#6B84A8]'
                }`}>
                {tf}
              </button>
            ))}
          </div>

          {/* ── Inline KEY STATS (always visible on mobile, checkprice-style) ── */}
          <div className="lg:hidden px-4 pt-4 pb-2">
            <div className="text-[10px] text-[#3D5270] font-bold uppercase tracking-[0.15em] mb-3">Key Stats</div>
            <div className="grid grid-cols-3 gap-0 border border-white/[0.06] rounded-2xl overflow-hidden">
              {[
                { label: 'Liquidity', value: token.liquidity > 0 ? fmt(token.liquidity) : '—' },
                { label: 'Mcap', value: token.marketCap > 0 ? fmt(token.marketCap) : '—' },
                { label: 'FDV', value: token.fdv ? fmt(token.fdv) : token.marketCap > 0 ? fmt(token.marketCap) : '—' },
                { label: 'Supply', value: token.supply ? fmtNum(token.supply) + 'M' : '—' },
                { label: 'Vol 5m', value: token.volume5m ? fmt(token.volume5m) : '$0.00' },
                { label: 'Vol 24h', value: fmt(token.volume24h) },
                { label: '24h', value: fmtPct(token.change24h), color: token.change24h >= 0 ? '#00D084' : '#FF3E3E' },
                { label: 'Holders', value: token.holders ? fmtNum(token.holders) : '—' },
                { label: 'Age', value: token.age ?? '—' },
              ].map(({ label, value, color }, i) => (
                <div key={label} className="px-3 py-3 flex flex-col gap-0.5" style={{ background: i % 2 === 0 ? '#0A111E' : '#080F1B', borderRight: i % 3 !== 2 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span className="text-[9px] text-[#3D5270] uppercase tracking-wider font-semibold">{label}</span>
                  <span className="text-[13px] font-bold font-mono" style={{ color: color ?? '#EEF2FF' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabs: Overview / Perps / Social ───────────────── */}
          <div className="flex border-b border-white/[0.05] flex-shrink-0" style={{ background: '#07101F' }}>
            {(['overview', 'perps', 'social'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[12px] font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-[#1B4FFF] text-white'
                    : 'border-transparent text-[#3D5270] hover:text-[#6B84A8]'
                }`}>
                {tab === 'perps' ? 'Perps' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Overview: Key Stats ────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              <h3 className="section-header">Key Stats</h3>

              {token.isMajor ? (
                /* Major token stats layout (BTC/ETH/SOL) */
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Rank" value={`#${token.rank ?? '—'}`} />
                  <StatBox label="Market Cap" value={fmt(token.marketCap)} />
                  <StatBox label="FDV" value={token.fdv ? fmt(token.fdv) : '= Market Cap'} sub={token.fdv === token.marketCap ? '= Market Cap' : undefined} />
                  <div className="stats-grid-item col-span-1">
                    <div className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">Volume 24H</div>
                    <div className="text-[16px] font-black font-mono text-[#EEF2FF]">{fmt(token.volume24h)}</div>
                    <div className="text-[11px] text-[#00D084] mt-1">+59.0%</div>
                  </div>
                  <div className="stats-grid-item col-span-1">
                    <div className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">ATH</div>
                    <div className="text-[14px] font-black font-mono text-[#EEF2FF]">{token.ath ? fmt(token.ath) : '—'}</div>
                    {token.athBelow && (
                      <div className="text-[10px] text-[#FF3E3E] mt-1">{token.athBelow.toFixed(1)}% below ATH</div>
                    )}
                    {token.athBelow && (
                      <ProgressBar value={100 - token.athBelow} max={100} color="#FF3E3E" />
                    )}
                  </div>
                  <div className="stats-grid-item col-span-1">
                    <div className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">Circulating</div>
                    <div className="text-[14px] font-black font-mono text-[#EEF2FF]">{token.circulating ? fmtNum(token.circulating) : '—'}</div>
                    {token.circulatingMax && (
                      <>
                        <div className="text-[10px] text-[#3D5270] mt-1">{token.circulatingMax.toFixed(1)}% of max</div>
                        <ProgressBar value={token.circulatingMax} max={100} color="#00D084" />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular token stats (memes / DeFi) */
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Liquidity" value={fmt(token.liquidity)} />
                  <StatBox label="Mcap" value={token.marketCap > 0 ? fmt(token.marketCap) : '—'} />
                  <StatBox label="FDV" value={token.fdv ? fmt(token.fdv) : token.marketCap > 0 ? fmt(token.marketCap) : '—'} />
                  <StatBox label="Supply" value={token.supply ? `${fmtNum(token.supply)}` : '—'} />
                  <StatBox label="Vol 5m" value={token.volume5m ? fmt(token.volume5m) : '$0.00'} />
                  <StatBox label="Vol 24h" value={fmt(token.volume24h)} />
                  <StatBox label="24h" value={fmtPct(token.change24h)} color={token.change24h >= 0 ? '#00D084' : '#FF3E3E'} />
                  <StatBox label="Holders" value={token.holders ? fmtNum(token.holders) : '—'} />
                  <StatBox label="Age" value={token.age ?? '—'} />
                </div>
              )}

              {/* Buy/Sell Pressure */}
              {token.buys24h !== undefined && token.sells24h !== undefined && (
                <div>
                  <h3 className="section-header mb-3">Buy / Sell Pressure</h3>
                  <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex justify-between text-[12px] mb-2">
                      <span className="text-[#00D084] font-bold">Buys: {fmtNum(token.buys24h)}</span>
                      <span className="text-[#FF3E3E] font-bold">Sells: {fmtNum(token.sells24h)}</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00D084] rounded-l-full transition-all"
                        style={{ width: `${(token.buys24h / (token.buys24h + token.sells24h)) * 100}%`, boxShadow: '0 0 8px #00D08480' }} />
                      <div className="bg-[#FF3E3E] rounded-r-full flex-1" style={{ boxShadow: '0 0 8px #FF3E3E80' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {token.description && (
                <div>
                  <h3 className="section-header mb-2">About</h3>
                  <p className="text-[12px] text-[#6B84A8] leading-relaxed bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-4">
                    {token.description}
                  </p>
                </div>
              )}

              {/* Links */}
              {(token.website || token.twitter || token.telegram) && (
                <div>
                  <h3 className="section-header mb-2">Links</h3>
                  <div className="flex gap-2 flex-wrap">
                    {token.website && (
                      <a href={token.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[11px] text-[#6B84A8] hover:text-white hover:border-white/15 transition-all">
                        <Globe size={12} /> Website
                      </a>
                    )}
                    {token.twitter && (
                      <a href={token.twitter} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[11px] text-[#6B84A8] hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 transition-all">
                        <Twitter size={12} /> Twitter
                      </a>
                    )}
                    <a href={`https://etherscan.io/token/${token.address}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[11px] text-[#6B84A8] hover:text-white hover:border-white/15 transition-all">
                      <ExternalLink size={12} /> Explorer
                    </a>
                  </div>
                </div>
              )}

              {/* Note for tokenized assets */}
              <div className="text-center text-[11px] text-[#3D5270] italic">
                Note: this is a tokenized version of the asset on-chain.
              </div>
            </div>
          )}

          {/* ── Perps Tab ─────────────────────────────────────── */}
          {activeTab === 'perps' && (
            <div className="p-4 space-y-4">
              <h3 className="section-header">Perpetuals</h3>

              {/* Exchange filter */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {PERP_EXCHANGES.map(ex => (
                  <button key={ex} onClick={() => setSelectedExchange(ex)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedExchange === ex
                        ? 'bg-[#1B4FFF]/15 text-white border border-[#1B4FFF]/30'
                        : 'bg-white/[0.04] text-[#3D5270] border border-white/[0.07] hover:text-[#6B84A8]'
                    }`}>
                    {ex}
                  </button>
                ))}
              </div>

              {/* Perp stats */}
              {token.fundingRate !== undefined ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="stats-grid-item">
                    <div className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider mb-2">Funding Rate</div>
                    <div className="text-[15px] font-black font-mono" style={{ color: token.fundingRate >= 0 ? '#00D084' : '#FF3E3E' }}>
                      {token.fundingRate >= 0 ? '+' : ''}{token.fundingRate.toFixed(4)}%
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: token.fundingRate >= 0 ? '#00D084' : '#FF3E3E' }}>
                      {token.fundingRate < 0 ? 'Bearish' : 'Bullish'}
                    </div>
                  </div>
                  <StatBox label="Open Interest" value={token.openInterest ? fmt(token.openInterest) : '—'} />
                  <StatBox label="24H Volume" value={token.perpVolume24h ? fmt(token.perpVolume24h) : '—'} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity size={32} className="text-[#3D5270] mb-3" />
                  <p className="text-[13px] text-[#3D5270]">No perpetuals data for this token</p>
                </div>
              )}

              {/* Funding rate history chart placeholder */}
              {token.fundingRate !== undefined && (
                <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl p-4">
                  <div className="text-[11px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-3">Funding Rate History</div>
                  <div className="flex items-end gap-1 h-16">
                    {[-0.12, -0.08, 0.04, -0.11, -0.06, 0.02, -0.10, -0.09, 0.03, -0.11, -0.08, -0.11].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-center">
                        <div className="rounded-sm"
                          style={{
                            height: `${Math.abs(v) * 400}px`,
                            background: v < 0 ? '#FF3E3E' : '#00D084',
                            opacity: 0.7,
                          }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-[#3D5270] mt-1">
                    <span>7 days ago</span>
                    <span>Now</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Social Tab ────────────────────────────────────── */}
          {activeTab === 'social' && (
            <div className="p-4 space-y-4">
              <h3 className="section-header">Social Intelligence</h3>
              <div className="space-y-3">
                {[
                  { label: 'Sentiment Score', value: '72 / 100', color: '#00D084', sub: 'Bullish majority' },
                  { label: 'Social Volume 24h', value: '14,320', color: '#EEF2FF', sub: '+42% vs yesterday' },
                  { label: 'Twitter Mentions', value: '8,140', color: '#1DA1F2', sub: 'Trending #12' },
                  { label: 'Reddit Activity', value: '2,840', color: '#FF4500', sub: '+18% up' },
                ].map(s => (
                  <StatBox key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} />
                ))}
              </div>

              {/* Context signals for this token */}
              <div>
                <h3 className="section-header mb-2">Recent Signals</h3>
                <Link href={`/context?token=${token.address}`}
                  className="block text-center py-3 rounded-xl bg-[#1B4FFF]/10 border border-[#1B4FFF]/20 text-[#7BA4FF] text-[13px] font-semibold hover:bg-[#1B4FFF]/20 transition-all">
                  View all signals for {token.symbol} →
                </Link>
              </div>
            </div>
          )}

          {/* Bottom spacer for mobile Buy button */}
          <div className="h-24 lg:h-4 flex-shrink-0" />
        </div>

        {/* ── RIGHT: Desktop Trading Panel ─────────────────── */}
        <div className="hidden lg:flex flex-col w-[320px] flex-shrink-0 border-l border-white/[0.06]" style={{ background: '#07101F' }}>
          {/* Buy/Sell tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['buy', 'sell'] as const).map(side => (
              <button key={side}
                onClick={() => setBuySide(side)}
                className={`flex-1 py-3 text-[13px] font-bold capitalize border-b-2 transition-all ${
                  buySide === side
                    ? side === 'buy' ? 'border-[#00D084] text-[#00D084]' : 'border-[#FF3E3E] text-[#FF3E3E]'
                    : 'border-transparent text-[#3D5270] hover:text-[#6B84A8]'
                }`}>
                {side}
              </button>
            ))}
          </div>

          {/* Trading form */}
          <div className="flex-1 p-5 space-y-4">
            {/* Order type */}
            <div>
              <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">Order Type</div>
              <div className="flex gap-2">
                {['Market', 'Limit'].map(t => (
                  <button key={t} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    t === 'Market'
                      ? 'bg-[#1B4FFF]/15 text-white border-[#1B4FFF]/30'
                      : 'text-[#3D5270] border-white/[0.07] hover:border-white/15 hover:text-[#6B84A8]'
                  }`}>{t}</button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">Amount (USD)</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D5270] font-mono">$</span>
                <input type="number" placeholder="0.00"
                  className="w-full bg-[#0D1A2B] border border-white/[0.07] rounded-xl pl-7 pr-4 py-3 text-[14px] font-mono text-white focus:outline-none focus:border-[#1B4FFF]/40 transition-colors"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }} />
              </div>
            </div>

            {/* Pct row */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map(p => (
                <button key={p} className="flex-1 py-1.5 text-[10px] font-bold text-[#3D5270] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-lg transition-all">
                  {p === 100 ? 'MAX' : `${p}%`}
                </button>
              ))}
            </div>

            {/* Price */}
            <div>
              <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-2">Current Price</div>
              <div className="text-[16px] font-mono font-bold text-white">{fmt(token.price)}</div>
            </div>

            {/* You receive */}
            <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-xl p-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#3D5270]">You receive</span>
                <span className="text-[#3D5270]">Fee: 0.1%</span>
              </div>
              <div className="text-[18px] font-mono font-bold text-white mt-1">0 {token.symbol}</div>
            </div>

            {/* CTA */}
            {buySide ? (
              <button
                className="w-full py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98]"
                style={{
                  background: buySide === 'buy'
                    ? 'linear-gradient(135deg, #00D084, #00A867)'
                    : 'linear-gradient(135deg, #FF3E3E, #CC3030)',
                  color: buySide === 'buy' ? '#000' : '#fff',
                  boxShadow: `0 0 24px ${buySide === 'buy' ? '#00D08440' : '#FF3E3E40'}`,
                }}>
                {buySide === 'buy' ? `Buy ${token.symbol}` : `Sell ${token.symbol}`}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setBuySide('buy')}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[14px] transition-all btn-buy">
                  Buy
                </button>
                <button onClick={() => setBuySide('sell')}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[14px] transition-all btn-sell">
                  Sell
                </button>
              </div>
            )}

            <p className="text-center text-[10px] text-[#3D5270]">MEV protected · Powered by Jupiter</p>

            {/* Related tools */}
            <div className="border-t border-white/[0.05] pt-4 space-y-2">
              <div className="text-[10px] text-[#1B4FFF] font-bold uppercase tracking-wider mb-3">Quick Access</div>
              {[
                { href: `/dna-analyzer?wallet=${account?.address ?? ''}`, label: 'Analyze My Wallet', icon: Shield },
                { href: `/scanner?address=${token.address}`, label: 'Scan This Token', icon: Zap },
                { href: `/context?token=${token.address}`, label: 'View Signals', icon: Activity },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#3D5270] hover:text-[#EEF2FF] hover:border-[#1B4FFF]/25 hover:bg-[#1B4FFF]/5 transition-all">
                  <Icon size={12} className="text-[#1B4FFF]" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky Buy/Sell bar (checkprice style) ──────── */}
      <div className="lg:hidden flex-shrink-0 flex gap-2.5 px-4 py-3 border-t border-white/[0.05]"
        style={{ background: '#07101F', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setBuySide('buy')}
          className="flex-1 py-4 rounded-2xl font-black text-[16px] transition-all active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg,#00D084,#00B870)', color: '#000', boxShadow: '0 4px 24px #00D08440' }}>
          Buy
        </button>
        <button
          onClick={() => setBuySide('sell')}
          className="w-24 py-4 rounded-2xl font-black text-[16px] transition-all active:scale-[0.97]"
          style={{ background: 'rgba(255,62,62,0.15)', color: '#FF3E3E', border: '1.5px solid rgba(255,62,62,0.3)' }}>
          Sell
        </button>
      </div>

      {/* Mobile buy/sell sheet */}
      {buySide && <BuySellSheet side={buySide} token={token} onClose={() => setBuySide(null)} />}
    </div>
  );
}
