'use client';

import { useEffect, useState } from 'react';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  size: number;
  usdValue: number;
  source: string;
  time: string;
  wallet?: string;
}

interface RecentTradesProps {
  tokenAddress?: string;
  tokenSymbol?: string;
  chain?: string;
  currentPrice?: number;
}

function randomTrades(basePrice: number, symbol: string): Trade[] {
  const sources = ['Jupiter', 'Raydium', 'Orca', 'Pump.fun', 'Meteora'];
  return Array.from({ length: 25 }, (_, i) => {
    const isBuy = Math.random() > 0.45;
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const size = Math.random() * 10000 + 50;
    const ago = Math.floor(Math.random() * 600);
    const mins = Math.floor(ago / 60);
    const secs = ago % 60;
    return {
      id: String(i),
      type: (isBuy ? 'buy' : 'sell') as 'buy' | 'sell',
      price,
      size,
      usdValue: size * price,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
      wallet: `${Math.random().toString(36).slice(2,6)}...${Math.random().toString(36).slice(2,6)}`,
    };
  }).sort((a, b) => a.time.localeCompare(b.time));
}

function fmtPrice(p: number): string {
  if (p < 0.001) return p.toFixed(8);
  if (p < 1) return p.toFixed(5);
  if (p < 10000) return p.toFixed(2);
  return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtSize(s: number): string {
  if (s >= 1_000_000) return `${(s/1_000_000).toFixed(2)}M`;
  if (s >= 1000) return `${(s/1000).toFixed(1)}K`;
  return s.toFixed(0);
}

export default function RecentTrades({ tokenAddress, tokenSymbol = 'TOKEN', chain, currentPrice = 1 }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>(() => randomTrades(currentPrice, tokenSymbol));

  // Simulate live trade ticks
  useEffect(() => {
    setTrades(randomTrades(currentPrice, tokenSymbol));
    const interval = setInterval(() => {
      const sources = ['Jupiter', 'Raydium', 'Orca', 'Pump.fun', 'Meteora'];
      const isBuy = Math.random() > 0.48;
      const price = currentPrice * (1 + (Math.random() - 0.5) * 0.015);
      const size = Math.random() * 8000 + 100;
      const newTrade: Trade = {
        id: Date.now().toString(),
        type: (isBuy ? 'buy' : 'sell') as 'buy' | 'sell',
        price,
        size,
        usdValue: size * price,
        source: sources[Math.floor(Math.random() * sources.length)],
        time: 'just now',
        wallet: `${Math.random().toString(36).slice(2,6)}...${Math.random().toString(36).slice(2,6)}`,
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 29)]);
    }, 2800);
    return () => clearInterval(interval);
  }, [currentPrice, tokenSymbol]);

  const totalBuys = trades.filter(t => t.type === 'buy').reduce((s, t) => s + t.usdValue, 0);
  const totalSells = trades.filter(t => t.type === 'sell').reduce((s, t) => s + t.usdValue, 0);
  const buyPct = totalBuys / (totalBuys + totalSells) * 100;

  return (
    <div className="flex flex-col h-full bg-[#0D1117] border-l border-white/6">
      <div className="px-3 py-2.5 border-b border-white/6">
        <div className="text-[12px] font-semibold text-white mb-2">Recent Trades</div>
        {/* Buy/Sell pressure bar */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#00C874]">{buyPct.toFixed(0)}% Buyers</span>
          <div className="flex-1 h-1 bg-[#FF4444] rounded-full overflow-hidden">
            <div className="h-full bg-[#00C874] rounded-full transition-all duration-500" style={{ width: `${buyPct}%` }} />
          </div>
          <span className="text-[#FF4444]">{(100-buyPct).toFixed(0)}% Sellers</span>
        </div>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-4 gap-1 px-3 py-1.5 text-[10px] text-white/25 border-b border-white/4">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Source</span>
        <span className="text-right">Time</span>
      </div>
      {/* Trade rows */}
      <div className="flex-1 overflow-y-auto">
        {trades.map((t, i) => (
          <div
            key={t.id}
            className={`grid grid-cols-4 gap-1 px-3 py-[5px] text-[11px] border-b border-white/3 hover:bg-white/3 transition-colors ${i === 0 ? 'animate-pulse-once' : ''}`}
          >
            <span className={`font-mono ${t.type === 'buy' ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
              {fmtPrice(t.price)}
            </span>
            <span className="text-right text-white/60 font-mono">{fmtSize(t.size)}</span>
            <span className="text-right text-white/35 truncate">{t.source}</span>
            <span className="text-right text-white/25">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
