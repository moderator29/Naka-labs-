'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Star, Filter, Search, Flame } from 'lucide-react';

interface MarketToken {
  id: string; symbol: string; name: string; price: number;
  change1h: number; change24h: number; change7d: number;
  volume24h: number; marketCap: number; chain: string; address: string;
  rank?: number; trending?: boolean; isNew?: boolean;
}

const MOCK_MARKETS: MarketToken[] = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',      price: 66_294,   change1h: 0.32,  change24h: -1.14, change7d: 3.2,   volume24h: 44_570_000_000, marketCap: 1_350_000_000_000, chain: 'ETHEREUM', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', rank: 1 },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',     price: 1_954,    change1h: -0.16, change24h: -2.38, change7d: -8.1,  volume24h: 14_200_000_000, marketCap: 238_000_000_000,   chain: 'ETHEREUM', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', rank: 2 },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',       price: 84.06,    change1h: -0.24, change24h: 0.88,  change7d: -5.4,  volume24h: 4_100_000_000,  marketCap: 38_000_000_000,    chain: 'SOLANA',   address: 'So11111111111111111111111111111111111111112', rank: 5 },
  { id: 'bnb',         symbol: 'BNB',  name: 'BNB',          price: 627.28,   change1h: 0.1,   change24h: 0.5,   change7d: 1.2,   volume24h: 1_900_000_000,  marketCap: 91_000_000_000,    chain: 'BSC',      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', rank: 4 },
  { id: 'hyperliquid', symbol: 'HYPE', name: 'Hyperliquid',  price: 31.71,    change1h: -0.16, change24h: 2.97,  change7d: 12.4,  volume24h: 22_500_000,     marketCap: 10_600_000_000,    chain: 'ARBITRUM', address: '0x0003', rank: 14, trending: true },
  { id: 'near',        symbol: 'NEAR', name: 'NEAR Protocol',price: 1.35,     change1h: 5.2,   change24h: 20.50, change7d: 18.3,  volume24h: 56_200_000,     marketCap: 1_620_000_000,     chain: 'ETHEREUM', address: '0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4', rank: 38, trending: true },
  { id: 'degen',       symbol: 'DEGEN',name: 'Degen',        price: 0.0082,   change1h: 3.2,   change24h: 12.40, change7d: 28.4,  volume24h: 9_800_000,      marketCap: 780_000_000,       chain: 'BASE',     address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', rank: 62, trending: true },
  { id: 'wif',         symbol: 'WIF',  name: 'dogwifhat',    price: 1.24,     change1h: -1.8,  change24h: -5.20, change7d: -12.1, volume24h: 340_000_000,    marketCap: 1_240_000_000,     chain: 'SOLANA',   address: '0x4e2', rank: 48 },
  { id: 'bonk',        symbol: 'BONK', name: 'Bonk',         price: 0.0000142,change1h: 0.8,   change24h: 3.10,  change7d: 8.2,   volume24h: 180_000_000,    marketCap: 1_050_000_000,     chain: 'SOLANA',   address: '0x4e3', rank: 53 },
  { id: 'lit',         symbol: 'LIT',  name: 'Litentry',     price: 1.32,     change1h: -1.2,  change24h: -4.80, change7d: -9.8,  volume24h: 172_700_000,    marketCap: 680_000_000,       chain: 'ETHEREUM', address: '0x4e4', rank: 72 },
  { id: 'mon',         symbol: 'MON',  name: 'Monad',        price: 0.0286,   change1h: 2.1,   change24h: 8.30,  change7d: 22.1,  volume24h: 241_000_000,    marketCap: 140_000_000,       chain: 'ETHEREUM', address: '0x4e5', trending: true, isNew: true },
  { id: 'zcash',       symbol: 'ZEC',  name: 'Zcash',        price: 214.83,   change1h: 0.4,   change24h: 3.60,  change7d: 5.8,   volume24h: 3_200_000,      marketCap: 3_500_000_000,     chain: 'ETHEREUM', address: '0x4e6', rank: 29 },
];

const CHAIN_COLORS: Record<string, string> = {
  ETHEREUM: '#627EEA', SOLANA: '#9945FF', BSC: '#F0B90B',
  BASE: '#0052FF', ARBITRUM: '#28A0F0', POLYGON: '#8247E5',
};
const CHAIN_FILTERS = ['All', 'ETHEREUM', 'SOLANA', 'BASE', 'BSC', 'ARBITRUM'];
const CATEGORY_TABS = [
  { id: 'all', label: 'All' }, { id: 'trending', label: '🔥 Trending' },
  { id: 'new', label: '✨ New' }, { id: 'gainers', label: '📈 Gainers' }, { id: 'losers', label: '📉 Losers' },
];
const TIMEFRAME_TABS = ['1H', '24H', '7D'];

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
  if (n < 0.001) return `$${n.toFixed(7)}`;
  if (n < 1)     return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export default function MarketsTab() {
  const [chainFilter, setChainFilter] = useState('All');
  const [category, setCategory]       = useState('all');
  const [timeframe, setTimeframe]     = useState('24H');
  const [searchQ, setSearchQ]         = useState('');
  const [favorites, setFavorites]     = useState<string[]>([]);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('sl-mkt-fav') ?? '[]') as string[];
    setFavorites(favs);
  }, []);

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('sl-mkt-fav', JSON.stringify(next));
      return next;
    });
  }

  function getChange(t: MarketToken) {
    if (timeframe === '1H') return t.change1h;
    if (timeframe === '7D') return t.change7d;
    return t.change24h;
  }

  const filtered = MOCK_MARKETS.filter(t => {
    if (chainFilter !== 'All' && t.chain !== chainFilter) return false;
    if (category === 'trending' && !t.trending) return false;
    if (category === 'new' && !t.isNew) return false;
    if (category === 'gainers' && getChange(t) <= 0) return false;
    if (category === 'losers'  && getChange(t) >= 0) return false;
    if (searchQ && !t.symbol.toLowerCase().includes(searchQ.toLowerCase()) && !t.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 px-4 pt-4 pb-24">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D5270]" />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search tokens..."
          className="w-full bg-[#0D1A2B] border border-white/[0.07] rounded-xl pl-8 pr-4 py-2.5 text-[12px] text-white placeholder-[#3D5270] focus:outline-none focus:border-[#1B4FFF]/40 transition-colors" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3">
        {CATEGORY_TABS.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              category === c.id ? 'bg-[#1B4FFF]/15 text-white border border-[#1B4FFF]/30' : 'text-[#3D5270] hover:text-[#6B84A8] border border-white/[0.06]'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Chain + Timeframe */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {CHAIN_FILTERS.map(c => {
            const col = CHAIN_COLORS[c] ?? '#6B84A8';
            return (
              <button key={c} onClick={() => setChainFilter(c)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
                  chainFilter === c ? 'text-white' : 'text-[#3D5270] hover:text-[#6B84A8] border-white/[0.06]'
                }`}
                style={chainFilter === c ? { background: `${col}25`, borderColor: `${col}45`, color: col } : { background: 'rgba(255,255,255,0.03)' }}>
                {c === 'All' ? 'All' : c === 'ETHEREUM' ? 'ETH' : c === 'ARBITRUM' ? 'ARB' : c.slice(0,4)}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {TIMEFRAME_TABS.map(t => (
            <button key={t} onClick={() => setTimeframe(t)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                timeframe === t ? 'bg-[#1B4FFF]/20 text-[#7BA4FF] border border-[#1B4FFF]/30' : 'text-[#3D5270] hover:text-[#6B84A8]'
              }`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D1A2B] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid px-4 py-2.5 border-b border-white/[0.05]" style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
          {['Token', 'Price', 'Change', 'Volume', 'MCap'].map(h => (
            <span key={h} className={`text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider ${h === 'Token' ? '' : 'text-right'} ${h === 'Token' ? '' : 'pl-3'}`}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Filter size={28} className="text-[#3D5270] mb-3" />
            <p className="text-[#3D5270] text-[12px]">No tokens match filters</p>
          </div>
        ) : (
          filtered.map(token => {
            const change = getChange(token);
            const chainColor = CHAIN_COLORS[token.chain] ?? '#6B84A8';
            const isFav = favorites.includes(token.id);
            return (
              <div key={token.id} className="group relative border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors">
                <Link href={`/market?token=${token.address}&chain=${token.chain}`}
                  className="grid items-center px-4 py-3 gap-3" style={{ gridTemplateColumns: '1fr auto auto auto auto' }}>
                  {/* Token */}
                  <div className="flex items-center gap-3 min-w-0">
                    {token.rank && <span className="text-[9px] text-[#3D5270] w-4 text-right flex-shrink-0">{token.rank}</span>}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${chainColor}, ${chainColor}80)` }}>
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#EEF2FF]">{token.symbol}</span>
                        {token.trending && <Flame size={9} className="text-[#FF6B35] flex-shrink-0" />}
                        {token.isNew && <span className="text-[8px] font-black px-1 py-0.5 rounded bg-[#1B4FFF]/20 text-[#7BA4FF] border border-[#1B4FFF]/30 flex-shrink-0">NEW</span>}
                      </div>
                      <div className="text-[10px] text-[#3D5270] truncate">{token.name}</div>
                    </div>
                  </div>
                  {/* Price */}
                  <div className="text-right font-mono text-[12px] text-[#EEF2FF] font-semibold pl-3">{fmt(token.price)}</div>
                  {/* Change */}
                  <div className={`text-right text-[11px] font-bold pl-3 flex items-center justify-end gap-0.5 ${change >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                    {change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </div>
                  {/* Volume */}
                  <div className="text-right text-[10px] font-mono text-[#6B84A8] pl-3">{fmt(token.volume24h)}</div>
                  {/* MCap */}
                  <div className="text-right text-[10px] font-mono text-[#6B84A8] pl-3">{fmt(token.marketCap)}</div>
                </Link>
                {/* Fav button */}
                <button onClick={() => toggleFav(token.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Star size={11} fill={isFav ? '#FFD23F' : 'none'} className={isFav ? 'text-[#FFD23F]' : 'text-[#3D5270]'} />
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="text-center mt-3 text-[10px] text-[#3D5270]">Powered by CoinGecko · DexScreener · Alchemy</div>
    </div>
  );
}
