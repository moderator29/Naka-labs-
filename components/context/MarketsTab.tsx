'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  chain: string;
  address: string;
}

const MOCK_MARKETS: MarketToken[] = [
  { symbol: 'BTC',  name: 'Bitcoin',  price: 66294,   change24h: -1.14, volume24h: 28_000_000_000, marketCap: 1_300_000_000_000, chain: 'ETHEREUM', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  { symbol: 'ETH',  name: 'Ethereum', price: 1954,    change24h: -2.38, volume24h: 12_000_000_000, marketCap: 235_000_000_000,   chain: 'ETHEREUM', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
  { symbol: 'SOL',  name: 'Solana',   price: 84.06,   change24h: 0.88,  volume24h: 1_800_000_000,  marketCap: 38_000_000_000,    chain: 'SOLANA',   address: 'So11111111111111111111111111111111111111112' },
  { symbol: 'BNB',  name: 'BNB',      price: 627.28,  change24h: 0.5,   volume24h: 1_200_000_000,  marketCap: 91_000_000_000,    chain: 'BSC',      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
  { symbol: 'DEGEN',name: 'Degen',    price: 0.0082,  change24h: 12.4,  volume24h: 9_800_000,      marketCap: 780_000_000,       chain: 'BASE',     address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed' },
  { symbol: 'HYPE', name: 'Hyperliquid', price: 31.71, change24h: 2.7,  volume24h: 22_500_000,     marketCap: 10_600_000_000,    chain: 'ARBITRUM', address: '0x0000000000000000000000000000000000000003' },
];

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3)  return `$${(n/1e3).toFixed(1)}K`;
  return `$${n.toFixed(4)}`;
}

export default function MarketsTab() {
  const [markets, setMarkets] = useState<MarketToken[]>(MOCK_MARKETS);

  useEffect(() => {
    fetch('/api/signals?type=BUY&limit=10')
      .then(r => r.json())
      .catch(() => null);
    // Use mock for now; in production integrate CoinGecko trending
  }, []);

  return (
    <div className="flex-1 px-4 pt-4">
      <div className="bg-[#12172A] rounded-2xl border border-white/8 overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-4 py-2.5 text-[11px] text-white/30 font-medium border-b border-white/6">
          <span>Token</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">Volume</span>
          <span className="text-right">MCap</span>
        </div>
        {markets.map((token) => (
          <Link
            key={token.symbol}
            href={`/market?token=${token.address}&chain=${token.chain}`}
            className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/4 hover:bg-white/4 transition-colors last:border-0"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                {token.symbol.slice(0,2)}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{token.symbol}</div>
                <div className="text-[10px] text-white/35">{token.chain}</div>
              </div>
            </div>
            <div className="text-right font-mono text-[13px] text-white self-center">{fmt(token.price)}</div>
            <div className={`text-right text-[12px] font-semibold self-center flex items-center justify-end gap-1 ${token.change24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
              {token.change24h >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
            </div>
            <div className="text-right text-[12px] text-white/50 self-center">{fmt(token.volume24h)}</div>
            <div className="text-right text-[12px] text-white/50 self-center">{fmt(token.marketCap)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
