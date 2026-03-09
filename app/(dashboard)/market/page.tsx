'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Search, TrendingUp, TrendingDown, Filter, ChevronDown, BarChart2, History, X } from 'lucide-react';
import { useTradingStore, TokenInfo } from '@/stores/tradingStore';

const TradingChart = dynamic(() => import('@/components/trading/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0F1419] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0A1EFF] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});
const TradingPanel = dynamic(() => import('@/components/trading/TradingPanel'), { ssr: false });
const RecentTrades = dynamic(() => import('@/components/trading/RecentTrades'), { ssr: false });

// ──────────────────────────────────
// Helpers
// ──────────────────────────────────
function fmt(n: number): string {
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
  if (n < 0.001) return `$${n.toFixed(8)}`;
  if (n < 1)     return `$${n.toFixed(5)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

const CATEGORY_TABS = ['All', 'Majors', 'DeFi', 'DePIN', 'Memes', 'AI', 'Gaming'];

const MOCK_TOKENS: TokenInfo[] = [
  { address: '0x0', symbol: 'SOL',  name: 'Solana',       price: 84.06,  change24h: 0.88,  volume24h: 1_800_000_000, liquidity: 200_000_000, marketCap: 38_000_000_000, chain: 'SOLANA',   chainId: '0',    pairAddress: '' },
  { address: '0x1', symbol: 'BTC',  name: 'Bitcoin',      price: 66294,  change24h: -1.14, volume24h: 28_000_000_000,liquidity: 2_000_000_000,marketCap:1_300_000_000_000,chain:'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x2', symbol: 'ETH',  name: 'Ethereum',     price: 1954,   change24h: -2.38, volume24h: 12_000_000_000,liquidity: 800_000_000, marketCap: 235_000_000_000, chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x3', symbol: 'HYPE', name: 'Hyperliquid',  price: 31.71,  change24h: 2.7,   volume24h: 22_500_000,   liquidity: 45_000_000,  marketCap: 10_600_000_000,  chain: 'ARBITRUM', chainId: '42161',pairAddress: '' },
  { address: '0x4', symbol: 'ZEC',  name: 'Zcash',        price: 214.83, change24h: -1.9,  volume24h: 3_200_000,    liquidity: 8_000_000,   marketCap: 3_500_000_000,   chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x5', symbol: 'NEAR', name: 'NEAR Protocol', price: 1.35,  change24h: 3.2,   volume24h: 56_200_000,   liquidity: 18_000_000,  marketCap: 1_620_000_000,   chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x6', symbol: 'LIT',  name: 'Litentry',     price: 1.32,   change24h: -4.8,  volume24h: 172_700_000,  liquidity: 5_000_000,   marketCap: 680_000_000,     chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x7', symbol: 'MON',  name: 'Monad',        price: 0.0286, change24h: 8.3,   volume24h: 241_000_000,  liquidity: 9_000_000,   marketCap: 140_000_000,     chain: 'ETHEREUM', chainId: '1',    pairAddress: '' },
  { address: '0x8', symbol: 'BNB',  name: 'BNB',          price: 627.28, change24h: 0.5,   volume24h: 1_200_000_000,liquidity: 300_000_000, marketCap: 91_000_000_000,  chain: 'BSC',      chainId: '56',   pairAddress: '' },
  { address: '0x9', symbol: 'DEGEN',name: 'Degen',        price: 0.0082, change24h: 12.4,  volume24h: 9_800_000,    liquidity: 4_200_000,   marketCap: 780_000_000,     chain: 'BASE',     chainId: '8453', pairAddress: '' },
  { address: '0xa', symbol: 'WIF',  name: 'dogwifhat',    price: 1.24,   change24h: -5.2,  volume24h: 340_000_000,  liquidity: 48_000_000,  marketCap: 1_240_000_000,   chain: 'SOLANA',   chainId: '0',    pairAddress: '' },
  { address: '0xb', symbol: 'BONK', name: 'Bonk',         price: 0.0000142,change24h: 3.1, volume24h: 180_000_000,  liquidity: 22_000_000,  marketCap: 1_050_000_000,   chain: 'SOLANA',   chainId: '0',    pairAddress: '' },
];

// Portfolio row type
interface PortfolioRow {
  symbol: string;
  balance: number;
  avgEntry: number;
  currentPrice: number;
  chain: string;
}

const MOCK_PORTFOLIO: PortfolioRow[] = [
  { symbol: 'Cash', balance: 565.67,   avgEntry: 1,    currentPrice: 1,    chain: '-' },
  { symbol: 'SOL',  balance: 0.083791, avgEntry: 84.50,currentPrice: 84.06,chain: 'SOL' },
];

// ──────────────────────────────────
// Sub-components
// ──────────────────────────────────
function TokenRow({ token, selected, onClick }: { token: TokenInfo; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full grid grid-cols-3 gap-1 px-3 py-2 text-left transition-colors ${
        selected ? 'bg-[#0A1EFF15] border-l-2 border-[#0A1EFF]' : 'hover:bg-white/4 border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
          {token.symbol.slice(0,2)}
        </div>
        <span className={`text-[12px] font-semibold ${selected ? 'text-white' : 'text-white/75'}`}>{token.symbol}</span>
      </div>
      <span className="text-[11px] font-mono text-right text-white/70 self-center">{fmt(token.price)}</span>
      <span className={`text-[11px] font-semibold text-right self-center ${token.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
      </span>
    </button>
  );
}

function BottomTabs({ activeTab, onChange }: { activeTab: string; onChange: (t: string) => void }) {
  return (
    <div className="flex items-center gap-0 border-b border-white/8 bg-[#0D1117]">
      {['Portfolio', 'Trade History'].map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors ${
            activeTab === tab
              ? 'border-[#00E5FF] text-white'
              : 'border-transparent text-white/35 hover:text-white/60'
          }`}
        >
          {tab === 'Portfolio' ? <span className="flex items-center gap-1.5"><BarChart2 size={12}/> Portfolio</span>
            : <span className="flex items-center gap-1.5"><History size={12}/> Trade History</span>}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────
// Filter modal
// ──────────────────────────────────
function FiltersModal({ onClose }: { onClose: () => void }) {
  const [assetType, setAssetType] = useState('Crypto');
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#12172A] w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-white/10 pb-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <span className="text-[15px] font-bold text-white">Filters</span>
          <button onClick={onClose}><X size={18} className="text-white/50" /></button>
        </div>
        {/* Asset type tabs */}
        <div className="flex gap-0 px-5 pt-4 border-b border-white/6 mb-2">
          {['Crypto', 'Stocks', 'Commodities', 'Forex'].map(t => (
            <button
              key={t}
              onClick={() => setAssetType(t)}
              className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-colors ${
                assetType === t ? 'border-white text-white' : 'border-transparent text-white/35'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {[
          { label: 'Blockchain',    value: 'All Chains' },
          { label: 'Market Cap',    value: 'All' },
          { label: 'Price Change',  value: 'All' },
          { label: 'Timeframe',     value: '24 H' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-[14px] font-semibold text-white">{item.label}</span>
            <span className="flex items-center gap-1 text-[13px] text-white/40">{item.value} <ChevronDown size={14}/></span>
          </div>
        ))}
        <div className="px-5 mt-6">
          <button onClick={onClose} className="w-full py-3.5 bg-[#00C874] text-black rounded-2xl font-bold text-[14px]">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────
// Main
// ──────────────────────────────────
function MarketPageInner() {
  const searchParams = useSearchParams();
  const { selectedToken, limitPrice, setSelectedToken, setLimitPrice } = useTradingStore();
  const [tokens, setTokens] = useState<TokenInfo[]>(MOCK_TOKENS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [bottomTab, setBottomTab] = useState('Portfolio');
  const [showFilters, setShowFilters] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(true);

  // Handle ?token= query param
  useEffect(() => {
    const addr = searchParams.get('token');
    const chain = searchParams.get('chain');
    if (addr) {
      const found = MOCK_TOKENS.find(t => t.address === addr || t.chain === chain);
      if (found) setSelectedToken(found);
    }
    if (!selectedToken) setSelectedToken(MOCK_TOKENS[0]);
  }, [searchParams, setSelectedToken, selectedToken]);

  // Fetch real tokens from DexScreener
  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/market/chart?symbol=BTC&interval=1D');
      // Just validate API is alive; real token list uses mock
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const filtered = tokens.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.symbol.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0A0E1A] overflow-hidden">
      {/* Top Search Row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#0D1117] flex-shrink-0">
        <div className="relative flex-shrink-0" style={{ width: 220 }}>
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search or paste contract address..."
            className="w-full bg-white/6 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-[#0A1EFF]"
          />
        </div>
        {/* Category tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {CATEGORY_TABS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                category === cat ? 'bg-white/12 text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="ml-auto p-2 rounded-xl text-white/35 hover:text-white hover:bg-white/6 transition-colors flex-shrink-0"
        >
          <Filter size={14} />
        </button>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Token list (~200px) */}
        <div className="w-52 flex-shrink-0 bg-[#0D1117] border-r border-white/8 flex flex-col overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-3 gap-1 px-3 py-2 text-[10px] text-white/25 border-b border-white/6 flex-shrink-0">
            <span>MARKET</span>
            <span className="text-right">PRICE</span>
            <span className="text-right">VOLUME</span>
          </div>
          {/* Token rows */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(token => (
              <TokenRow
                key={token.address}
                token={token}
                selected={selectedToken?.address === token.address}
                onClick={() => setSelectedToken(token)}
              />
            ))}
          </div>
        </div>

        {/* CENTER: Chart + Bottom panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Token price header */}
          {selectedToken && (
            <div className="flex items-center gap-3 px-3 py-2 border-b border-white/8 bg-[#0D1117] flex-shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[13px] font-bold text-white">{selectedToken.symbol}</span>
                <span className="text-[11px] text-white/30">{selectedToken.chain}</span>
              </div>
              <span className="text-[15px] font-mono font-bold text-white flex-shrink-0">{fmt(selectedToken.price)}</span>
              <span className={`text-[12px] font-semibold flex-shrink-0 ${selectedToken.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
              </span>
              <div className="h-3 w-px bg-white/10 flex-shrink-0" />
              <span className="text-[11px] text-white/30 flex-shrink-0">24h Vol: <span className="text-white/55">{fmt(selectedToken.volume24h)}</span></span>
              <span className="text-[11px] text-white/30 flex-shrink-0">Liq: <span className="text-white/55">{fmt(selectedToken.liquidity)}</span></span>
              <span className="text-[11px] text-white/30 flex-shrink-0">MCap: <span className="text-white/55">{fmt(selectedToken.marketCap)}</span></span>
              <Link
                href={`/context?token=${selectedToken.address}`}
                className="ml-auto flex-shrink-0 text-[11px] text-[#A855F7] hover:text-purple-300 transition-colors"
              >
                View Signals →
              </Link>
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 min-h-0">
            <TradingChart token={selectedToken} onPriceClick={setLimitPrice} />
          </div>

          {/* Bottom panel: Portfolio / Trade History */}
          {showBottomPanel && (
            <div className="h-44 flex-shrink-0 bg-[#0D1117] border-t border-white/8 flex flex-col">
              <BottomTabs activeTab={bottomTab} onChange={setBottomTab} />
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {bottomTab === 'Portfolio' ? (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-white/25">
                        <th className="text-left pb-2 font-medium">Asset</th>
                        <th className="text-right pb-2 font-medium">Balance</th>
                        <th className="text-right pb-2 font-medium">Avg Entry</th>
                        <th className="text-right pb-2 font-medium">Current Price</th>
                        <th className="text-right pb-2 font-medium">Cost Basis</th>
                        <th className="text-right pb-2 font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_PORTFOLIO.map(row => {
                        const pnl = (row.currentPrice - row.avgEntry) * (row.balance / row.avgEntry);
                        const pnlPct = ((row.currentPrice - row.avgEntry) / row.avgEntry) * 100;
                        const costBasis = row.balance;
                        return (
                          <tr key={row.symbol} className="border-t border-white/4">
                            <td className="py-1.5 font-semibold text-white">{row.symbol}</td>
                            <td className="text-right text-white/60 font-mono">
                              {row.symbol === 'Cash' ? `$${row.balance.toFixed(2)}` : row.balance.toFixed(6)}
                            </td>
                            <td className="text-right text-white/50 font-mono">{row.symbol === 'Cash' ? '—' : fmt(row.avgEntry)}</td>
                            <td className="text-right text-white/50 font-mono">{row.symbol === 'Cash' ? '—' : fmt(row.currentPrice)}</td>
                            <td className="text-right text-white/50 font-mono">{row.symbol === 'Cash' ? '—' : fmt(costBasis)}</td>
                            <td className={`text-right font-mono font-semibold ${row.symbol === 'Cash' ? 'text-white/30' : pnl >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                              {row.symbol === 'Cash' ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} (${pnlPct.toFixed(1)}%)`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-[12px] text-white/25">
                    No recent trades. Connect wallet to view history.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Recent Trades + Buy/Sell Panel */}
        <div className="flex flex-col flex-shrink-0" style={{ width: 340 }}>
          {/* Recent Trades — top half */}
          <div className="flex-[45] min-h-0 overflow-hidden border-b border-white/8">
            <RecentTrades
              tokenAddress={selectedToken?.address}
              tokenSymbol={selectedToken?.symbol}
              chain={selectedToken?.chain}
              currentPrice={selectedToken?.price}
            />
          </div>
          {/* Trading Panel — bottom half */}
          <div className="flex-[55] min-h-0 overflow-y-auto">
            <TradingPanel
              token={selectedToken}
              limitPrice={limitPrice}
              onLimitPriceChange={setLimitPrice}
            />
          </div>
        </div>
      </div>

      {/* Filters modal */}
      {showFilters && <FiltersModal onClose={() => setShowFilters(false)} />}
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-[#0A0E1A]">
        <div className="w-8 h-8 border-2 border-[#0A1EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketPageInner />
    </Suspense>
  );
}
