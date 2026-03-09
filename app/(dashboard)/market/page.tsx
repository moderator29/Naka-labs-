'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, Filter, ChevronDown, BarChart2, History,
  X, Activity, PieChart, Star, Zap, Layers, ArrowUpDown,
  RefreshCw, TrendingUp, TrendingDown, Globe, Wallet,
} from 'lucide-react';
import { useTradingStore, TokenInfo } from '@/stores/tradingStore';
import { useActiveAccount } from 'thirdweb/react';
import toast from 'react-hot-toast';

// ─── Dynamic imports ───────────────────────────────────────────
const TradingChart = dynamic(() => import('@/components/trading/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0F1419] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
const BubbleMap    = dynamic(() => import('@/components/trading/BubbleMap'), { ssr: false });
const TradingPanel = dynamic(() => import('@/components/trading/TradingPanel'), { ssr: false });
const RecentTrades = dynamic(() => import('@/components/trading/RecentTrades'), { ssr: false });

// ─── Types ─────────────────────────────────────────────────────
interface TokenInfoExtended extends TokenInfo {
  change1h?: number;
  change4h?: number;
  volume5m?: number;
  coingeckoId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 0.01)  return `$${n.toFixed(6)}`;
  if (n < 1)     return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// ─── Token asset map ───────────────────────────────────────────
const COINGECKO_ICONS: Record<string, string> = {
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  WIF:  'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.png',
  BONK: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  ZEC:  'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png',
  HYPE: 'https://assets.coingecko.com/coins/images/53973/small/hyperliquid.png',
};
const TOKEN_COLORS: Record<string, string> = {
  SOL: '#9945FF', BTC: '#F7931A', ETH: '#627EEA', BNB: '#F0B90B',
  HYPE: '#00E5FF', ZEC: '#ECB244', NEAR: '#00C08B', WIF: '#E17C29',
  BONK: '#E27C2D', MON: '#8B5CF6', LIT: '#FF4D8D', DEGEN: '#A855F7',
};

// ─── Mock tokens ───────────────────────────────────────────────
const MOCK_TOKENS: TokenInfoExtended[] = [
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL',   name: 'Solana',        price: 84.06,      change24h: 0.88,  change1h: -0.24, change4h: 0.64,  volume24h: 1_800_000_000, volume5m: 62_480_000, liquidity: 200_000_000,   marketCap: 38_000_000_000,    chain: 'SOLANA',   chainId: '0',    pairAddress: '', coingeckoId: 'solana' },
  { address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB', symbol: 'BTC',   name: 'Bitcoin',       price: 66294,      change24h: -1.14, change1h: 0.32,  change4h: -0.8,  volume24h: 28_000_000_000, volume5m: 180_000_000, liquidity: 2_000_000_000, marketCap: 1_300_000_000_000, chain: 'ETHEREUM', chainId: '1',    pairAddress: '', coingeckoId: 'bitcoin' },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'ETH',   name: 'Ethereum',      price: 1954,       change24h: -2.38, change1h: -0.16, change4h: -1.2,  volume24h: 12_000_000_000, volume5m: 90_000_000,  liquidity: 800_000_000,   marketCap: 235_000_000_000,   chain: 'ETHEREUM', chainId: '1',    pairAddress: '', coingeckoId: 'ethereum' },
  { address: '0x4200000000000000000000000000000000000042', symbol: 'HYPE',  name: 'Hyperliquid',   price: 31.71,      change24h: 2.97,  change1h: -0.16, change4h: 0.8,   volume24h: 22_500_000,    volume5m: 4_200_000,   liquidity: 45_000_000,    marketCap: 10_600_000_000,    chain: 'ARBITRUM', chainId: '42161',pairAddress: '', coingeckoId: 'hyperliquid' },
  { address: '0x4a', symbol: 'ZEC',   name: 'Zcash',         price: 214.83,     change24h: 3.6,   change1h: 0.4,   change4h: 1.8,   volume24h: 3_200_000,     volume5m: 280_000,     liquidity: 8_000_000,     marketCap: 3_500_000_000,     chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x4b', symbol: 'NEAR',  name: 'NEAR Protocol', price: 1.35,       change24h: 20.5,  change1h: 5.2,   change4h: 12.1,  volume24h: 56_200_000,    volume5m: 3_800_000,   liquidity: 18_000_000,    marketCap: 1_620_000_000,     chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x4c', symbol: 'LIT',   name: 'Litentry',      price: 1.32,       change24h: -4.8,  change1h: -1.2,  change4h: -2.1,  volume24h: 172_700_000,   volume5m: 1_200_000,   liquidity: 5_000_000,     marketCap: 680_000_000,       chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x4d', symbol: 'MON',   name: 'Monad',         price: 0.0286,     change24h: 8.3,   change1h: 2.1,   change4h: 4.5,   volume24h: 241_000_000,   volume5m: 8_200_000,   liquidity: 9_000_000,     marketCap: 140_000_000,       chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x4e', symbol: 'BNB',   name: 'BNB',           price: 627.28,     change24h: 0.5,   change1h: 0.1,   change4h: 0.3,   volume24h: 1_200_000_000, volume5m: 42_000_000,  liquidity: 300_000_000,   marketCap: 91_000_000_000,    chain: 'BSC',      chainId: '56',   pairAddress: '' },
  { address: '0x4f', symbol: 'DEGEN', name: 'Degen',         price: 0.0082,     change24h: 12.4,  change1h: 3.2,   change4h: 8.1,   volume24h: 9_800_000,     volume5m: 680_000,     liquidity: 4_200_000,     marketCap: 780_000_000,       chain: 'BASE',     chainId: '8453', pairAddress: '' },
  { address: '0x50', symbol: 'WIF',   name: 'dogwifhat',     price: 1.24,       change24h: -5.2,  change1h: -1.8,  change4h: -3.2,  volume24h: 340_000_000,   volume5m: 18_000_000,  liquidity: 48_000_000,    marketCap: 1_240_000_000,     chain: 'SOLANA',   chainId: '0',    pairAddress: '' },
  { address: '0x51', symbol: 'BONK',  name: 'Bonk',          price: 0.0000142,  change24h: 3.1,   change1h: 0.8,   change4h: 1.9,   volume24h: 180_000_000,   volume5m: 9_200_000,   liquidity: 22_000_000,    marketCap: 1_050_000_000,     chain: 'SOLANA',   chainId: '0',    pairAddress: '' },
];

const CATEGORY_TABS = ['All', 'Majors', 'DeFi', 'DePIN', 'Memes', 'AI', 'Gaming'];
const CATEGORY_MAP: Record<string, string[]> = {
  Majors: ['BTC', 'ETH', 'SOL', 'BNB'],
  DeFi:   ['HYPE', 'ZEC', 'LIT'],
  Memes:  ['WIF', 'BONK', 'DEGEN'],
  AI:     ['MON'],
  DePIN:  [],
  Gaming: [],
};

const MOCK_PORTFOLIO = [
  { symbol: 'Cash', balance: 565.67,   avgEntry: 1,     currentPrice: 1,     chain: '-' },
  { symbol: 'SOL',  balance: 0.083791, avgEntry: 84.50, currentPrice: 84.06, chain: 'SOL' },
];

// ─── Token Icon ────────────────────────────────────────────────
function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = COINGECKO_ICONS[symbol];
  const bgColor = TOKEN_COLORS[symbol] || '#6B7280';

  if (iconUrl && !imgError) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size, background: `${bgColor}20` }}>
        <Image src={iconUrl} alt={symbol} width={size} height={size} className="w-full h-full object-cover" onError={() => setImgError(true)} unoptimized />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ width: size, height: size, fontSize: size * 0.34, background: `${bgColor}22`, border: `1.5px solid ${bgColor}55`, color: bgColor }}>
      {symbol.slice(0, 2)}
    </div>
  );
}

// ─── Chain Badge ───────────────────────────────────────────────
function ChainBadge({ chain }: { chain: string }) {
  const colors: Record<string, string> = {
    SOLANA: '#9945FF', ETHEREUM: '#627EEA', BSC: '#F0B90B',
    BASE: '#0052FF', ARBITRUM: '#12AAFF', POLYGON: '#8247E5',
  };
  const c = colors[chain] || '#6B7280';
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${c}20`, color: c, border: `1px solid ${c}40` }}>
      {chain === 'ETHEREUM' ? 'ETH' : chain.slice(0, 4)}
    </span>
  );
}

// ─── Filters Modal ─────────────────────────────────────────────
function FiltersModal({ onClose }: { onClose: () => void }) {
  const [assetType, setAssetType] = useState('Crypto');
  const [blockchain, setBlockchain] = useState('All Chains');
  const [marketCap, setMarketCap] = useState('All');
  const [priceChange, setPriceChange] = useState('All');
  const [timeframe, setTimeframe] = useState('24 H');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#12172A] w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-white/10 pb-safe"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <span className="text-[15px] font-bold text-white">Filters</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        {/* Asset type tabs */}
        <div className="flex px-5 pt-4 pb-0 border-b border-white/6 gap-0">
          {['Crypto', 'Stocks', 'Commodities', 'Forex'].map(t => (
            <button
              key={t}
              onClick={() => setAssetType(t)}
              className={`pb-3 px-3 text-[13px] font-semibold border-b-2 transition-all ${assetType === t ? 'border-white text-white' : 'border-transparent text-white/35 hover:text-white/60'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filter rows */}
        {[
          { label: 'Blockchain',   value: blockchain,   set: setBlockchain,   opts: ['All Chains','Solana','Ethereum','Base','Arbitrum','BSC'] },
          { label: 'Market Cap',   value: marketCap,    set: setMarketCap,    opts: ['All','Large Cap (>$1B)','Mid Cap ($100M–$1B)','Small Cap (<$100M)'] },
          { label: 'Price Change', value: priceChange,  set: setPriceChange,  opts: ['All','Gainers','Losers','>10% up','>10% down'] },
          { label: 'Timeframe',    value: timeframe,    set: setTimeframe,    opts: ['1 H','4 H','24 H','7 D'] },
        ].map(({ label, value, set, opts }) => (
          <details key={label} className="group border-b border-white/5">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/3 transition-colors">
              <span className="text-[14px] font-semibold text-white">{label}</span>
              <span className="flex items-center gap-1.5 text-[13px] text-white/40">
                {value} <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-200" />
              </span>
            </summary>
            <div className="px-5 pb-3 flex flex-col gap-1">
              {opts.map(opt => (
                <button
                  key={opt}
                  onClick={() => set(opt)}
                  className={`text-left px-3 py-2 rounded-lg text-[13px] transition-all ${value === opt ? 'bg-[#00C874]/15 text-[#00C874] font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </details>
        ))}

        <div className="px-5 mt-5 mb-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#00C874] hover:bg-[#00E882] active:scale-[0.98] text-black rounded-2xl font-bold text-[14px] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Buy/Sell Bottom Sheet ──────────────────────────────
function MobileBuySellSheet({ side, token, onClose }: { side: 'buy' | 'sell'; token: TokenInfoExtended | null; onClose: () => void }) {
  const account = useActiveAccount();
  const [amount, setAmount] = useState('0');
  const [pct, setPct] = useState(0);
  const [isUSD, setIsUSD] = useState(true);
  const [executing, setExecuting] = useState(false);
  const availableUSD = 141.42;

  function appendDigit(d: string) {
    if (d === '⌫') { setAmount(p => p.length > 1 ? p.slice(0, -1) : '0'); return; }
    if (d === '.' && amount.includes('.')) return;
    if (amount === '0' && d !== '.') setAmount(d);
    else if (amount.length < 10) setAmount(p => p + d);
  }

  function applyPct(p: number) {
    setPct(p);
    const val = p === 0 ? '0' : (availableUSD * p / 100).toFixed(2);
    setAmount(val);
  }

  async function handleExecute() {
    if (!account) { toast.error('Connect wallet to trade'); return; }
    const v = parseFloat(amount);
    if (!v || v <= 0) { toast.error('Enter a valid amount'); return; }
    setExecuting(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`${side === 'buy' ? '🟢 Buy' : '🔴 Sell'} order submitted — $${amount}`);
    setExecuting(false);
    onClose();
  }

  const displayVal = isUSD ? `$${amount}` : amount;
  const numpadKeys = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="w-full bg-[#0D1117] rounded-t-3xl border-t border-white/10 px-5 pt-3 pb-8"
        style={{ animation: 'slideUp 0.22s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TokenIcon symbol={token?.symbol ?? 'SOL'} size={28} />
            <h2 className={`text-[18px] font-bold ${side === 'buy' ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
              {side === 'buy' ? 'Buy' : 'Sell'} {token?.symbol}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition-colors">
            <X size={15} className="text-white/60" />
          </button>
        </div>

        {/* Amount display */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className={`text-[44px] font-bold tracking-tight ${amount === '0' ? 'text-white/30' : 'text-white'}`}>
            {displayVal}
          </span>
          <button
            onClick={() => setIsUSD(p => !p)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition-colors"
          >
            <ArrowUpDown size={16} className="text-white/60" />
          </button>
        </div>

        {/* Percentage slider */}
        <div className="mb-1">
          <input
            type="range" min={0} max={100} step={1} value={pct}
            onChange={e => applyPct(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: side === 'buy' ? '#00C874' : '#FF4444' }}
          />
        </div>
        <div className="flex justify-between mb-4">
          {[0, 25, 50, 75, 100].map((p, i) => (
            <button
              key={p}
              onClick={() => applyPct(p)}
              className={`text-[11px] font-semibold px-1 transition-colors ${pct === p ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {i === 4 ? 'MAX' : `${p}%`}
            </button>
          ))}
        </div>

        {/* Available */}
        <div className="flex justify-between text-[12px] mb-4 px-1">
          <span className="text-white/35">Available</span>
          <span className="text-white/60 font-mono">${availableUSD.toFixed(2)}</span>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {numpadKeys.map(key => (
            <button
              key={key}
              onClick={() => appendDigit(key)}
              className="py-[14px] text-[20px] font-semibold text-white bg-white/5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95"
            >
              {key === '⌫' ? (
                <span className="flex items-center justify-center">
                  <svg width="20" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 1H8L1 8l7 7h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" />
                    <line x1="16" y1="5" x2="11" y2="10" />
                    <line x1="11" y1="5" x2="16" y2="10" />
                  </svg>
                </span>
              ) : key}
            </button>
          ))}
        </div>

        {/* Execute / Connect */}
        <button
          onClick={handleExecute}
          disabled={executing}
          className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all active:scale-[0.98] disabled:opacity-60 ${
            !account
              ? 'bg-[#00C874] text-black'
              : side === 'buy'
              ? 'bg-[#00C874] text-black hover:bg-[#00E882]'
              : 'bg-[#FF4444] text-white hover:bg-[#FF6666]'
          }`}
        >
          {executing ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin" /> Executing...
            </span>
          ) : !account ? (
            <span className="flex items-center justify-center gap-2">
              <Wallet size={16} /> Connect Wallet
            </span>
          ) : (
            `${side === 'buy' ? 'Buy' : 'Sell'} ${token?.symbol ?? 'Token'}`
          )}
        </button>
        <p className="text-center text-[11px] text-white/20 mt-3">0.1% fee · MEV protected · Powered by Jupiter</p>
      </div>
    </div>
  );
}

// ─── Token List Row ─────────────────────────────────────────────
function TokenRow({ token, selected, onClick }: { token: TokenInfoExtended; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all border-l-2 ${
        selected ? 'bg-[#00E5FF0A] border-[#00E5FF]' : 'border-transparent hover:bg-white/3 hover:border-white/15'
      }`}
    >
      <TokenIcon symbol={token.symbol} size={22} />
      <div className="flex-1 min-w-0">
        <div className={`text-[12px] font-bold leading-tight ${selected ? 'text-white' : 'text-white/80'}`}>{token.symbol}</div>
        <div className="text-[10px] text-white/28 truncate">{fmt(token.volume24h)}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[11px] font-mono text-white/70 leading-tight">{fmt(token.price)}</div>
        <div className={`text-[10px] font-semibold ${token.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
          {fmtPct(token.change24h)}
        </div>
      </div>
    </button>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────
function StatsTab({ token }: { token: TokenInfoExtended | null }) {
  if (!token) return null;
  const rows = [
    { label: '1h Change',   value: token.change1h ?? 0,    isChange: true },
    { label: '4h Change',   value: token.change4h ?? 0,    isChange: true },
    { label: '24h Change',  value: token.change24h,         isChange: true },
    { label: '5m Volume',   value: token.volume5m ?? 0,    isChange: false, format: 'vol' },
    { label: '24h Volume',  value: token.volume24h,         isChange: false, format: 'vol' },
    { label: 'Liquidity',   value: token.liquidity,         isChange: false, format: 'vol' },
    { label: 'Market Cap',  value: token.marketCap,         isChange: false, format: 'vol' },
  ];
  return (
    <div className="overflow-y-auto">
      {rows.map(({ label, value, isChange }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/2 transition-colors">
          <span className="text-[13px] text-white/50">{label}</span>
          <span className={`text-[13px] font-semibold ${isChange ? (value >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]') : 'text-white'}`}>
            {isChange ? fmtPct(value) : fmt(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Key Stats Tab ──────────────────────────────────────────────
const KEY_STATS_MOCK: Record<string, {
  liquidity: number; fdv: number; supply: string; holders: number;
  buys5m: number; sells5m: number; buys1h: number; sells1h: number; buys24h: number; sells24h: number;
  age: string; txns24h: number; priceImpact: number; poolCreated: string;
}> = {
  SOL:  { liquidity: 200_000_000, fdv: 42_000_000_000, supply: '579M', holders: 1_840_000, buys5m: 128, sells5m: 74, buys1h: 1840, sells1h: 1230, buys24h: 38_200, sells24h: 29_100, age: '5y 8m', txns24h: 67_300, priceImpact: 0.02, poolCreated: 'Mar 2020' },
  BTC:  { liquidity: 2_000_000_000, fdv: 1_390_000_000_000, supply: '21M', holders: 46_000_000, buys5m: 2840, sells5m: 1920, buys1h: 48_200, sells1h: 38_100, buys24h: 1_200_000, sells24h: 980_000, age: '15y 2m', txns24h: 2_180_000, priceImpact: 0.001, poolCreated: 'Jan 2009' },
  ETH:  { liquidity: 800_000_000, fdv: 235_000_000_000, supply: '120M', holders: 102_000_000, buys5m: 1240, sells5m: 860, buys1h: 18_600, sells1h: 14_200, buys24h: 448_000, sells24h: 370_000, age: '9y 7m', txns24h: 818_000, priceImpact: 0.003, poolCreated: 'Jul 2015' },
  HYPE: { liquidity: 45_000_000, fdv: 15_000_000_000, supply: '1B', holders: 128_000, buys5m: 84, sells5m: 31, buys1h: 1020, sells1h: 640, buys24h: 24_200, sells24h: 18_100, age: '5m', txns24h: 42_300, priceImpact: 0.08, poolCreated: 'Oct 2024' },
  DEFAULT: { liquidity: 8_000_000, fdv: 900_000_000, supply: '500M', holders: 42_000, buys5m: 42, sells5m: 28, buys1h: 480, sells1h: 320, buys24h: 11_400, sells24h: 9_200, age: '8m', txns24h: 20_600, priceImpact: 0.15, poolCreated: 'Jul 2024' },
};

function KeyStatsTab({ token }: { token: TokenInfoExtended | null }) {
  if (!token) return null;
  const stats = KEY_STATS_MOCK[token.symbol] ?? KEY_STATS_MOCK.DEFAULT;
  const totalBuys24h = stats.buys24h + stats.sells24h;
  const buyPct = Math.round((stats.buys24h / totalBuys24h) * 100);

  const grid1 = [
    { label: 'Liquidity',  value: fmt(stats.liquidity),              color: '' },
    { label: 'Market Cap', value: fmt(token.marketCap),              color: '' },
    { label: 'FDV',        value: fmt(stats.fdv),                    color: '' },
    { label: 'Supply',     value: stats.supply,                      color: '' },
    { label: '5m Vol',     value: fmt(token.volume5m ?? 0),          color: '' },
    { label: '24h Vol',    value: fmt(token.volume24h),              color: '' },
    { label: '1h %',       value: fmtPct(token.change1h ?? 0),       color: (token.change1h ?? 0) >= 0 ? '#00C874' : '#FF4444' },
    { label: '24h %',      value: fmtPct(token.change24h),           color: token.change24h >= 0 ? '#00C874' : '#FF4444' },
    { label: 'Holders',    value: stats.holders.toLocaleString(),    color: '' },
    { label: 'Txns 24H',   value: stats.txns24h.toLocaleString(),    color: '' },
    { label: 'Age',        value: stats.age,                         color: '' },
    { label: 'Pool',       value: stats.poolCreated,                 color: '' },
  ];

  return (
    <div className="overflow-y-auto h-full">
      {/* Stats grid 4-col */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-b border-white/5">
        {grid1.map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D1117] px-3 py-2.5 flex flex-col gap-0.5">
            <span className="text-[9px] text-white/28 uppercase tracking-widest font-semibold">{label}</span>
            <span className="text-[12px] font-mono font-semibold" style={{ color: color || 'rgba(255,255,255,0.8)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Buy / Sell pressure */}
      <div className="px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Buy/Sell Pressure (24H)</span>
          <span className="text-[10px] text-white/30">{stats.buys24h.toLocaleString()}B / {stats.sells24h.toLocaleString()}S</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          <div className="bg-[#00C874] transition-all duration-700" style={{ width: `${buyPct}%`, boxShadow: '0 0 6px #00C87460' }} />
          <div className="bg-[#FF4444] flex-1" style={{ boxShadow: '0 0 6px #FF444460' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold text-[#00C874]">{buyPct}% Buys</span>
          <span className="text-[10px] font-bold text-[#FF4444]">{100 - buyPct}% Sells</span>
        </div>
      </div>

      {/* Txn timeframes */}
      <div className="grid grid-cols-3 gap-px bg-white/5">
        {[
          { tf: '5m', buys: stats.buys5m, sells: stats.sells5m },
          { tf: '1h', buys: stats.buys1h, sells: stats.sells1h },
          { tf: '24h', buys: stats.buys24h, sells: stats.sells24h },
        ].map(({ tf, buys, sells }) => (
          <div key={tf} className="bg-[#0D1117] px-3 py-2.5">
            <div className="text-[9px] text-white/28 uppercase tracking-wider font-semibold mb-1.5">{tf} Txns</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#00C874]">{buys >= 1000 ? `${(buys/1000).toFixed(1)}K` : buys}B</span>
              <span className="text-white/20 text-[10px]">/</span>
              <span className="text-[11px] font-bold text-[#FF4444]">{sells >= 1000 ? `${(sells/1000).toFixed(1)}K` : sells}S</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Portfolio Tab ──────────────────────────────────────────────
function PortfolioTab({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
        <Wallet size={28} className="text-white/20" />
        <p className="text-[12px] text-white/30">Connect wallet to view portfolio</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-[11px] min-w-[480px]">
        <thead>
          <tr className="text-white/25">
            {['Asset', 'Balance', 'Avg Entry', 'Current Price', 'Cost Basis', 'P&L'].map(h => (
              <th key={h} className={`pb-2 font-medium ${h === 'Asset' ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_PORTFOLIO.map(row => {
            const isToken = row.symbol !== 'Cash';
            const pnl    = isToken ? (row.currentPrice - row.avgEntry) * row.balance : 0;
            const pnlPct = isToken ? ((row.currentPrice - row.avgEntry) / row.avgEntry) * 100 : 0;
            return (
              <tr key={row.symbol} className="border-t border-white/4 hover:bg-white/2 transition-colors">
                <td className="py-2 font-semibold text-white">{row.symbol}</td>
                <td className="text-right text-white/60 font-mono">{isToken ? row.balance.toFixed(6) : `$${row.balance.toFixed(2)}`}</td>
                <td className="text-right text-white/40 font-mono">{isToken ? fmt(row.avgEntry) : '—'}</td>
                <td className="text-right text-white/40 font-mono">{isToken ? fmt(row.currentPrice) : '—'}</td>
                <td className="text-right text-white/40 font-mono">{isToken ? fmt(row.balance) : '—'}</td>
                <td className={`text-right font-mono font-semibold ${!isToken ? 'text-white/25' : pnl >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                  {!isToken ? '—' : `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)} (${pnlPct.toFixed(1)}%)`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Token Search Popup ────────────────────────────────────────
function TokenSearchOverlay({ tokens, onSelect, onClose }: { tokens: TokenInfoExtended[]; onSelect: (t: TokenInfoExtended) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TokenInfoExtended[]>(tokens);

  const doSearch = useCallback(async (query: string) => {
    if (!query) { setResults(tokens); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/market/chart?type=search&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.tokens?.length) {
        const mapped: TokenInfoExtended[] = data.tokens.map((t: { tokenAddress: string; symbol: string; name: string; chain: string; price: number; change24h: number; volume24h: number; marketCap: number; liquidity: number; pairAddress: string }) => ({
          address: t.tokenAddress, symbol: t.symbol, name: t.name,
          chain: t.chain, chainId: '0', price: t.price,
          change24h: t.change24h, volume24h: t.volume24h,
          marketCap: t.marketCap, liquidity: t.liquidity,
          pairAddress: t.pairAddress,
        }));
        setResults(mapped);
      } else {
        setResults(tokens.filter(t =>
          t.symbol.toLowerCase().includes(query.toLowerCase()) ||
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.address.toLowerCase().includes(query.toLowerCase())
        ));
      }
    } catch {
      setResults(tokens.filter(t =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setSearching(false);
    }
  }, [tokens]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(q), 350);
    return () => clearTimeout(timer);
  }, [q, doSearch]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={onClose}>
      <div className="bg-[#0D1117] border-b border-white/8 p-4" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, ticker, or contract address..."
            className="w-full bg-white/8 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#00E5FF]/60 transition-colors"
          />
          {searching ? (
            <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />
          ) : q ? (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-white/40" /></button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#0D1117]" onClick={e => e.stopPropagation()}>
        {results.slice(0, 20).map(token => (
          <button
            key={token.address}
            onClick={() => { onSelect(token); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/4"
          >
            <TokenIcon symbol={token.symbol} size={32} />
            <div className="flex-1 text-left min-w-0">
              <div className="font-bold text-white text-[13px]">{token.symbol}</div>
              <div className="text-[11px] text-white/40 truncate">{token.name}</div>
            </div>
            <ChainBadge chain={token.chain} />
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-[12px] font-mono text-white">{fmt(token.price)}</div>
              <div className={`text-[11px] font-semibold ${token.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                {fmtPct(token.change24h)}
              </div>
            </div>
          </button>
        ))}
        {results.length === 0 && !searching && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
            <Search size={32} />
            <p className="text-[13px]">No tokens found for &ldquo;{q}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Market Page ───────────────────────────────────────────
function MarketPageInner() {
  const searchParams = useSearchParams();
  const { selectedToken, limitPrice, setSelectedToken, setLimitPrice } = useTradingStore();
  const account = useActiveAccount();

  const [tokens]       = useState<TokenInfoExtended[]>(MOCK_TOKENS);
  const [category, setCategory] = useState('All');
  const [chartView, setChartView] = useState<'chart' | 'bubblemap'>('chart');
  const [bottomTab, setBottomTab] = useState('Key Stats');
  const [showFilters, setShowFilters]     = useState(false);
  const [mobileSide, setMobileSide]       = useState<'buy' | 'sell' | null>(null);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites]         = useState<string[]>(['SOL', 'BTC', 'ETH']);

  // On mount: set default token from URL or first
  useEffect(() => {
    const addr = searchParams.get('token');
    if (addr) {
      const found = tokens.find(t => t.address === addr || t.symbol.toUpperCase() === addr.toUpperCase());
      if (found) { setSelectedToken(found); return; }
    }
    if (!selectedToken) setSelectedToken(tokens[0]);
  }, [searchParams, tokens, setSelectedToken, selectedToken]);

  const token = selectedToken as TokenInfoExtended | null;

  // Filtered token list
  const filtered = tokens.filter(t => {
    if (showFavorites && !favorites.includes(t.symbol)) return false;
    const syms = CATEGORY_MAP[category];
    if (category !== 'All' && syms && !syms.includes(t.symbol)) return false;
    return true;
  });

  function toggleFavorite(symbol: string) {
    setFavorites(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  }

  const BOTTOM_TABS = [
    { id: 'Key Stats',     icon: BarChart2 },
    { id: 'Portfolio',     icon: PieChart },
    { id: 'Trade History', icon: History },
    { id: 'Trades',        icon: Activity },
    { id: 'Stats',         icon: Layers },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0E1A] overflow-hidden">
      {/* ── Top Search & Category Row ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#0D1117] flex-shrink-0">
        {/* Search — opens full overlay */}
        <button
          onClick={() => setShowSearchOverlay(true)}
          className="flex items-center gap-2 bg-white/6 border border-white/8 rounded-xl pl-3 pr-4 py-1.5 text-[12px] text-white/35 hover:border-white/20 transition-colors flex-shrink-0"
          style={{ width: 230 }}
        >
          <Search size={13} className="text-white/30 flex-shrink-0" />
          <span className="truncate">Search or paste contract address...</span>
        </button>

        {/* Category tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setShowFavorites(p => !p)}
            className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-semibold whitespace-nowrap transition-all flex-shrink-0 ${showFavorites ? 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30' : 'text-white/35 hover:text-white/60'}`}
          >
            <Star size={10} fill={showFavorites ? 'currentColor' : 'none'} />
          </button>
          {CATEGORY_TABS.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setShowFavorites(false); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                category === cat && !showFavorites
                  ? 'bg-white/14 text-white ring-1 ring-white/20'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button onClick={() => setShowFilters(true)} className="ml-auto p-1.5 rounded-xl text-white/35 hover:text-white hover:bg-white/8 transition-colors flex-shrink-0">
          <Filter size={15} />
        </button>
      </div>

      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Token List — desktop only ── */}
        <div className="hidden lg:flex w-[210px] flex-shrink-0 bg-[#0D1117] border-r border-white/8 flex-col overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-[10px] text-white/22 border-b border-white/6 flex-shrink-0 uppercase tracking-widest font-semibold">
            <span>Market</span>
            <span className="text-right">24H</span>
          </div>
          {/* Rows */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {filtered.map(t => (
              <div key={t.address} className="relative group">
                <TokenRow token={t} selected={selectedToken?.address === t.address} onClick={() => setSelectedToken(t)} />
                <button
                  onClick={() => toggleFavorite(t.symbol)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Star size={9} fill={favorites.includes(t.symbol) ? '#FFD23F' : 'none'} className={favorites.includes(t.symbol) ? 'text-[#FFD23F]' : 'text-white/30'} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Chart + Tabs ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Token price header */}
          {token && (
            <div className="flex items-center gap-2.5 px-3 py-2 border-b border-white/8 bg-[#0D1117] flex-shrink-0 overflow-x-auto scrollbar-hide">
              {/* Symbol + price */}
              <button
                onClick={() => setShowSearchOverlay(true)}
                className="flex items-center gap-2 flex-shrink-0 hover:bg-white/5 rounded-xl px-2 py-1 -ml-2 transition-colors"
              >
                <TokenIcon symbol={token.symbol} size={24} />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-bold text-white leading-tight">{token.symbol}/USD</span>
                    <ChevronDown size={12} className="text-white/30" />
                  </div>
                  <ChainBadge chain={token.chain} />
                </div>
              </button>

              <div className="h-7 w-px bg-white/10 flex-shrink-0" />

              {/* Price */}
              <div className="flex-shrink-0">
                <div className="text-[17px] font-mono font-bold text-white leading-tight">{fmt(token.price)}</div>
                <div className={`text-[11px] font-semibold ${token.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                  {fmtPct(token.change24h)}
                </div>
              </div>

              {/* Stats chips — hide on small screens */}
              <div className="hidden md:flex items-center gap-4 text-[11px] flex-shrink-0">
                {[
                  { label: '1H', val: token.change1h ?? 0, type: 'pct' },
                  { label: '24H', val: token.change24h, type: 'pct' },
                  { label: '5M VOL', val: token.volume5m ?? 0, type: 'vol' },
                  { label: 'MCap', val: token.marketCap, type: 'vol' },
                ].map(({ label, val, type }) => (
                  <div key={label} className="flex-shrink-0">
                    <span className="text-white/28">{label} </span>
                    <span className={type === 'pct' ? (val >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]') : 'text-white/65'}>
                      {type === 'pct' ? fmtPct(val) : fmt(val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleFavorite(token.symbol)} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
                  <Star size={13} fill={favorites.includes(token.symbol) ? '#FFD23F' : 'none'} className={favorites.includes(token.symbol) ? 'text-[#FFD23F]' : 'text-white/30'} />
                </button>
                <Link href={`/scanner?token=${token.address}`} className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[#A855F7] hover:bg-[#A855F7]/10 transition-colors flex-shrink-0">
                  <Zap size={11} /> Scan
                </Link>
                <Link href={`/context?token=${token.address}`} className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors flex-shrink-0">
                  <Activity size={11} /> Signals
                </Link>
              </div>
            </div>
          )}

          {/* Chart view tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-[#0A0E1A] border-b border-white/6 flex-shrink-0">
            {([
              { id: 'chart',     label: 'Chart',      icon: TrendingUp },
              { id: 'bubblemap', label: 'Bubble Map', icon: Layers },
            ] as { id: 'chart' | 'bubblemap'; label: string; icon: React.ComponentType<{ size: number }> }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setChartView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  chartView === id ? 'bg-white/12 text-white' : 'text-white/35 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
            {/* Trending indicator */}
            {token && (
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white/25 flex-shrink-0 pr-1">
                {token.change24h >= 0
                  ? <TrendingUp size={11} className="text-[#00C874]" />
                  : <TrendingDown size={11} className="text-[#FF4444]" />}
                <span>{token.symbol} · {fmtPct(token.change24h)}</span>
              </div>
            )}
          </div>

          {/* Chart / Bubble Map area */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {chartView === 'chart' ? (
              <TradingChart token={token} onPriceClick={setLimitPrice} />
            ) : (
              <div className="absolute inset-0 overflow-auto bg-[#0A0E1A] p-3">
                <BubbleMap tokenSymbol={token?.symbol} tokenAddress={token?.address} chain={token?.chain} />
              </div>
            )}
          </div>

          {/* Bottom tabs — Portfolio, Trade History, Trades, Stats */}
          <div className="flex-shrink-0 bg-[#0D1117] border-t border-white/8" style={{ height: 196 }}>
            <div className="flex border-b border-white/6 overflow-x-auto scrollbar-hide">
              {BOTTOM_TABS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setBottomTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                    bottomTab === id ? 'border-[#00E5FF] text-white' : 'border-transparent text-white/28 hover:text-white/55 hover:border-white/15'
                  }`}
                >
                  <Icon size={10} /> {id}
                </button>
              ))}
            </div>
            <div style={{ height: 152 }} className="overflow-y-auto">
              {bottomTab === 'Key Stats'     && <KeyStatsTab token={token} />}
              {bottomTab === 'Portfolio'     && <PortfolioTab connected={!!account} />}
              {bottomTab === 'Stats'         && <StatsTab token={token} />}
              {(bottomTab === 'Trade History' || bottomTab === 'Trades') && (
                <div className="flex flex-col items-center justify-center h-full text-[12px] text-white/25 gap-2">
                  <History size={24} className="text-white/15" />
                  {account ? 'No recent trades.' : 'Connect wallet to view history.'}
                </div>
              )}
            </div>
          </div>

          {/* Mobile sticky Buy/Sell buttons */}
          <div className="lg:hidden flex gap-2.5 px-3 py-2.5 bg-[#0D1117] border-t border-white/8 flex-shrink-0">
            <button onClick={() => setMobileSide('buy')}  className="flex-1 py-3.5 bg-[#00C874] hover:bg-[#00E882] active:scale-[0.98] text-black font-bold rounded-xl text-[14px] transition-all">Buy</button>
            <button onClick={() => setMobileSide('sell')} className="flex-1 py-3.5 bg-[#FF4444] hover:bg-[#FF6666] active:scale-[0.98] text-white font-bold rounded-xl text-[14px] transition-all">Sell</button>
          </div>
        </div>

        {/* RIGHT: Recent Trades + Trading Panel — desktop only ── */}
        <div className="hidden lg:flex flex-col flex-shrink-0 border-l border-white/8" style={{ width: 340 }}>
          {/* Recent Trades — top */}
          <div className="flex-[45] min-h-0 overflow-hidden border-b border-white/8">
            <RecentTrades tokenAddress={token?.address} tokenSymbol={token?.symbol} chain={token?.chain} currentPrice={token?.price} />
          </div>
          {/* Trading Panel — bottom */}
          <div className="flex-[55] min-h-0 overflow-y-auto">
            <TradingPanel token={token} limitPrice={limitPrice} onLimitPriceChange={setLimitPrice} />
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      {mobileSide && <MobileBuySellSheet side={mobileSide} token={token} onClose={() => setMobileSide(null)} />}
      {showFilters  && <FiltersModal onClose={() => setShowFilters(false)} />}
      {showSearchOverlay && (
        <TokenSearchOverlay
          tokens={tokens}
          onSelect={t => setSelectedToken(t)}
          onClose={() => setShowSearchOverlay(false)}
        />
      )}
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────
export default function MarketPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-[#0A0E1A]">
        <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketPageInner />
    </Suspense>
  );
}
