'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Brain, Zap, Clock, Target, ChevronRight, Minus } from 'lucide-react';
import Link from 'next/link';

const PREDICTIONS = [
  {
    symbol: 'SOL', name: 'Solana', chain: 'SOLANA',
    prediction: 'BULLISH', confidence: 84, timeframe: '24h',
    target: 92.50, current: 84.06, stopLoss: 79.00,
    reason: 'Smart money accumulation + rising Pump.fun activity',
    signals: ['3 alpha wallets accumulated', 'Pump.fun volume +42%', 'Whale inflows $4.2M'],
    color: '#9945FF',
  },
  {
    symbol: 'ETH', name: 'Ethereum', chain: 'ETHEREUM',
    prediction: 'BEARISH', confidence: 71, timeframe: '48h',
    target: 1780, current: 1954, stopLoss: 2050,
    reason: 'Whale outflows to exchanges, macro headwinds',
    signals: ['$180M moved to Binance', 'ETF outflows 3 days', 'RSI divergence'],
    color: '#627EEA',
  },
  {
    symbol: 'BTC', name: 'Bitcoin', chain: 'ETHEREUM',
    prediction: 'NEUTRAL', confidence: 58, timeframe: '24h',
    target: 67500, current: 66294, stopLoss: 64000,
    reason: 'Consolidation phase, waiting for macro catalyst',
    signals: ['Low volatility 72h', 'Funding rate neutral', 'Options OI flat'],
    color: '#F7931A',
  },
  {
    symbol: 'DEGEN', name: 'Degen', chain: 'BASE',
    prediction: 'BULLISH', confidence: 91, timeframe: '72h',
    target: 0.0115, current: 0.0082, stopLoss: 0.0070,
    reason: '3 alpha wallets accumulated, low sell pressure',
    signals: ['Alpha wallet 0x3f..a1 +$84K', 'Only 12% supply on CEX', 'Discord activity +180%'],
    color: '#A855F7',
  },
  {
    symbol: 'HYPE', name: 'Hyperliquid', chain: 'ARBITRUM',
    prediction: 'BULLISH', confidence: 77, timeframe: '48h',
    target: 38.20, current: 31.71, stopLoss: 28.50,
    reason: 'Protocol revenue milestone approaching, strong community',
    signals: ['TVL ATH $2.1B', 'Revenue $8.4M/day', 'Token unlock completed'],
    color: '#00E5FF',
  },
  {
    symbol: 'WIF', name: 'dogwifhat', chain: 'SOLANA',
    prediction: 'BEARISH', confidence: 65, timeframe: '24h',
    target: 0.98, current: 1.24, stopLoss: 1.38,
    reason: 'Memecoin rotation risk, large wallets distributing',
    signals: ['Top 10 holder sold 18%', 'Social volume down 35%', 'Binance futures OI -$42M'],
    color: '#E17C29',
  },
];

const CHAIN_COLORS: Record<string, string> = {
  SOLANA: '#9945FF', ETHEREUM: '#627EEA', BSC: '#F3BA2F',
  BASE: '#0052FF', ARBITRUM: '#28A0F0',
};

function fmt(p: number): string {
  if (p < 0.00001) return `$${p.toFixed(8)}`;
  if (p < 0.001) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

type FilterType = 'All' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
type TimeFilterType = 'All' | '24h' | '48h' | '72h';

export default function PredictionsTab() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = PREDICTIONS.filter(p => {
    if (filter !== 'All' && p.prediction !== filter) return false;
    if (timeFilter !== 'All' && p.timeframe !== timeFilter) return false;
    return true;
  });

  const bullCount  = PREDICTIONS.filter(p => p.prediction === 'BULLISH').length;
  const bearCount  = PREDICTIONS.filter(p => p.prediction === 'BEARISH').length;
  const bullPct    = Math.round((bullCount / PREDICTIONS.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* AI header banner */}
      <div className="mx-4 mt-4 mb-3 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1E35 0%, #1a1040 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
                VTX AI Predictions
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7]">LIVE</span>
              </div>
              <div className="text-[11px] text-white/40">Updated hourly · on-chain + social signals</div>
            </div>
          </div>
          {/* Sentiment bar */}
          <div className="text-right">
            <div className="text-[11px] text-white/40 mb-1">Market Sentiment</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#00C874]">{bullPct}% Bull</span>
              <div className="w-16 h-1.5 bg-[#FF4444]/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#00C874] rounded-full" style={{ width: `${bullPct}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#FF4444]">{100 - bullPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-3 flex items-center gap-2 flex-wrap">
        {(['All', 'BULLISH', 'BEARISH', 'NEUTRAL'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
            style={{
              background: filter === f
                ? f === 'BULLISH' ? '#00C87420' : f === 'BEARISH' ? '#FF444420' : f === 'NEUTRAL' ? '#FFD23F20' : '#1B4FFF20'
                : 'rgba(255,255,255,0.06)',
              color: filter === f
                ? f === 'BULLISH' ? '#00C874' : f === 'BEARISH' ? '#FF4444' : f === 'NEUTRAL' ? '#FFD23F' : '#7B8CFF'
                : 'rgba(255,255,255,0.35)',
              border: `1px solid ${filter === f
                ? f === 'BULLISH' ? '#00C87430' : f === 'BEARISH' ? '#FF444430' : f === 'NEUTRAL' ? '#FFD23F30' : '#1B4FFF30'
                : 'transparent'}`,
            }}
          >
            {f === 'BULLISH' ? '📈 ' : f === 'BEARISH' ? '📉 ' : f === 'NEUTRAL' ? '↔ ' : ''}{f}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          {(['All', '24h', '48h', '72h'] as TimeFilterType[]).map(t => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                timeFilter === t ? 'bg-white/12 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction cards */}
      <div className="px-4 pb-4 space-y-2.5">
        {filtered.map((p) => {
          const isBull = p.prediction === 'BULLISH';
          const isBear = p.prediction === 'BEARISH';
          const isNeutral = p.prediction === 'NEUTRAL';
          const changeToTarget = ((p.target - p.current) / p.current) * 100;
          const isExpanded = expanded === p.symbol;
          const chainColor = CHAIN_COLORS[p.chain] ?? '#8B91A0';
          const chainShort = p.chain === 'ETHEREUM' ? 'ETH' : p.chain === 'SOLANA' ? 'SOL' : p.chain.slice(0, 4);

          const predColor = isBull ? '#00C874' : isBear ? '#FF4444' : '#FFD23F';
          const predBg    = isBull ? '#00C87418' : isBear ? '#FF444418' : '#FFD23F18';

          return (
            <div
              key={p.symbol}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: '#0D1A2B',
                border: `1px solid ${isExpanded ? p.color + '30' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isExpanded ? `0 0 20px ${p.color}10` : 'none',
              }}
            >
              {/* Main row */}
              <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(isExpanded ? null : p.symbol)}
              >
                <div className="flex items-start gap-3">
                  {/* Left: colored dot + symbol */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px]" style={{ background: `${p.color}18`, color: p.color, border: `1.5px solid ${p.color}30` }}>
                      {p.symbol.slice(0, 3)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Row 1: symbol + badges */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[14px] font-bold text-white">{p.symbol}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: chainColor + '18', color: chainColor }}>
                        {chainShort}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5" style={{ background: predBg, color: predColor }}>
                        {isBull ? <TrendingUp size={9} /> : isBear ? <TrendingDown size={9} /> : <Minus size={9} />}
                        {p.prediction}
                      </span>
                      <span className="text-[10px] text-white/30 flex items-center gap-0.5 ml-auto">
                        <Clock size={9} /> {p.timeframe}
                      </span>
                    </div>

                    {/* Row 2: reason */}
                    <p className="text-[11px] text-white/45 leading-relaxed mb-2">{p.reason}</p>

                    {/* Row 3: confidence bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${p.confidence}%`,
                            background: p.confidence >= 80 ? '#00C874' : p.confidence >= 60 ? '#FFD23F' : '#FF6B35',
                            boxShadow: `0 0 4px ${p.confidence >= 80 ? '#00C874' : p.confidence >= 60 ? '#FFD23F' : '#FF6B35'}60`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/35 whitespace-nowrap">{p.confidence}% conf</span>
                    </div>
                  </div>

                  {/* Right: target */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end mb-0.5">
                      <Target size={10} className="text-white/25" />
                      <span className="text-[12px] font-mono font-bold text-white">{fmt(p.target)}</span>
                    </div>
                    <div className={`text-[11px] font-bold ${changeToTarget >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                      {changeToTarget >= 0 ? '+' : ''}{changeToTarget.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-white/20">target</div>
                  </div>

                  <ChevronRight
                    size={14}
                    className={`text-white/20 flex-shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/6 pt-3">
                  {/* Signal chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.signals.map((sig, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 text-white/50 flex items-center gap-1">
                        <Zap size={8} className="text-[#FFD23F]" /> {sig}
                      </span>
                    ))}
                  </div>

                  {/* Entry / Target / Stop */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Current', val: fmt(p.current), color: 'text-white' },
                      { label: 'Target', val: fmt(p.target), color: isBull ? 'text-[#00C874]' : 'text-[#FF4444]' },
                      { label: 'Stop Loss', val: fmt(p.stopLoss), color: 'text-[#FF6B35]' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-[9px] text-white/30 mb-0.5 uppercase tracking-wide">{label}</div>
                        <div className={`text-[12px] font-mono font-bold ${color}`}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Link to token page */}
                  <Link
                    href={`/token/${p.symbol.toLowerCase()}?chain=${p.chain}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold transition-all hover:opacity-80"
                    style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}
                  >
                    View Full Analysis <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/30">
            <Brain size={28} />
            <p className="text-[12px]">No predictions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
