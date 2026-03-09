'use client';

import { TrendingUp, TrendingDown, Brain } from 'lucide-react';

const PREDICTIONS = [
  { symbol: 'SOL',  prediction: 'BULLISH', confidence: 84, timeframe: '24h', target: 92.50,  current: 84.06, reason: 'Smart money accumulation + rising Pump.fun activity' },
  { symbol: 'ETH',  prediction: 'BEARISH', confidence: 71, timeframe: '48h', target: 1780,   current: 1954,  reason: 'Whale outflows to exchanges, macro headwinds' },
  { symbol: 'BTC',  prediction: 'NEUTRAL', confidence: 58, timeframe: '24h', target: 67500,  current: 66294, reason: 'Consolidation phase, waiting for macro catalyst' },
  { symbol: 'DEGEN',prediction: 'BULLISH', confidence: 91, timeframe: '72h', target: 0.0115, current: 0.0082, reason: '3 alpha wallets accumulated, low sell pressure' },
  { symbol: 'HYPE', prediction: 'BULLISH', confidence: 77, timeframe: '48h', target: 38.20,  current: 31.71, reason: 'Protocol revenue milestone approaching, strong community' },
];

function fmt(p: number): string {
  if (p < 0.001) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export default function PredictionsTab() {
  return (
    <div className="flex-1 px-4 pt-4">
      <div className="flex items-center gap-2 mb-4 text-white/40 text-[12px]">
        <Brain size={14} className="text-purple-400" />
        VTX AI predictions — updated every hour based on on-chain signals, whale movements, and social sentiment
      </div>
      <div className="space-y-3">
        {PREDICTIONS.map((p) => {
          const isBull = p.prediction === 'BULLISH';
          const isBear = p.prediction === 'BEARISH';
          const changeToTarget = ((p.target - p.current) / p.current) * 100;
          return (
            <div key={p.symbol} className="bg-[#12172A] border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-bold text-white">{p.symbol}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      isBull ? 'bg-[#00C87420] text-[#00C874]' :
                      isBear ? 'bg-[#FF444420] text-[#FF4444]' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {isBull ? <TrendingUp size={10}/> : isBear ? <TrendingDown size={10}/> : null}
                      {p.prediction}
                    </span>
                    <span className="text-[11px] text-white/30">{p.timeframe}</span>
                  </div>
                  <p className="text-[12px] text-white/45 leading-relaxed">{p.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-mono font-bold text-white">{fmt(p.target)}</div>
                  <div className={`text-[11px] font-semibold ${changeToTarget >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>
                    {changeToTarget >= 0 ? '+' : ''}{changeToTarget.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-white/25 mt-0.5">target</div>
                </div>
              </div>
              {/* Confidence bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.confidence}%`,
                      backgroundColor: p.confidence >= 80 ? '#00C874' : p.confidence >= 60 ? '#FFD23F' : '#FF6B35',
                    }}
                  />
                </div>
                <span className="text-[11px] text-white/35">{p.confidence}% confidence</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
