'use client';

import Link from 'next/link';
import { Share2, Eye, Heart, Bookmark } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils/formatters';

export interface Signal {
  id: string;
  type: string;
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  title: string;
  summary: string;
  platform?: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  buys24h?: number;
  sells24h?: number;
  amount?: number;
  amountUSD?: number;
  trustScore: number;
  walletAddress?: string;
  txHash?: string;
  likes: number;
  shares: number;
  views: number;
  riskLevel?: string;
  createdAt: string | Date;
}

// Signal type → display label + color
const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  WHALE_MOVEMENT:   { label: 'WHALE',   bg: '#FFD23F22', text: '#FFD23F' },
  SMART_MONEY:      { label: 'SMART',   bg: '#00E5FF22', text: '#00E5FF' },
  RUG_PULL_WARNING: { label: 'RUG',     bg: '#FF042022', text: '#FF0420' },
  BUY:              { label: 'BULLISH', bg: '#00C87422', text: '#00C874' },
  SELL:             { label: 'BEARISH', bg: '#FF6B3522', text: '#FF6B35' },
  NEW_POOL:         { label: 'NEW',     bg: '#0A1EFF22', text: '#7B8CFF' },
  UNUSUAL_VOLUME:   { label: 'HYPE',    bg: '#FF6B3522', text: '#FF6B35' },
  DEV_ACTIVITY:     { label: 'DEV',     bg: '#8C8DFC22', text: '#8C8DFC' },
};

const CHAIN_COLORS: Record<string, { text: string; bg: string }> = {
  SOLANA:   { text: '#9945FF', bg: '#9945FF15' },
  ETHEREUM: { text: '#627EEA', bg: '#627EEA15' },
  BASE:     { text: '#0052FF', bg: '#0052FF15' },
  BSC:      { text: '#F3BA2F', bg: '#F3BA2F15' },
  ARBITRUM: { text: '#28A0F0', bg: '#28A0F015' },
  POLYGON:  { text: '#8247E5', bg: '#8247E515' },
};

const RISK_CONFIG: Record<string, { label: string; color: string; barColor: string }> = {
  LOW:      { label: 'LOW',      color: '#00E5FF', barColor: '#00E5FF' },
  MEDIUM:   { label: 'MEDIUM',   color: '#FFD23F', barColor: '#FF9500' },
  HIGH:     { label: 'HIGH',     color: '#FF6B35', barColor: '#FF6B35' },
  CRITICAL: { label: 'CRITICAL', color: '#FF0420', barColor: '#FF0420' },
};

function getTrustRiskLevel(score: number): string {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

function formatCompact(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPrice(p: number): string {
  if (!p) return '$0';
  if (p < 0.000001) return `$${p.toFixed(10)}`;
  if (p < 0.001) return `$${p.toFixed(7)}`;
  if (p < 1) return `$${p.toFixed(6)}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
}

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const typeConf = TYPE_CONFIG[signal.type] ?? { label: signal.type.replace(/_/g, ' '), bg: '#8B91A022', text: '#8B91A0' };
  const chainConf = CHAIN_COLORS[signal.chain] ?? { text: '#8B91A0', bg: '#8B91A015' };
  const riskKey = signal.riskLevel ?? getTrustRiskLevel(signal.trustScore);
  const riskConf = RISK_CONFIG[riskKey] ?? RISK_CONFIG.MEDIUM;
  const chainShort = signal.chain === 'SOLANA' ? 'SOL' : signal.chain === 'ETHEREUM' ? 'ETH' : signal.chain.slice(0, 4);

  return (
    <div className="bg-[#12172A] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 hover:shadow-[0_0_24px_rgba(10,30,255,0.15)] transition-all duration-200">
      <div className="p-4 flex flex-col gap-3">
        {/* Row 1: badges + timestamp + bookmark */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: typeConf.bg, color: typeConf.text }}
          >
            {typeConf.label}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
            style={{ backgroundColor: chainConf.bg, color: chainConf.text }}
          >
            {chainShort}
          </span>
          {signal.platform && (
            <span className="text-[11px] text-white/50 bg-white/6 px-2 py-0.5 rounded">
              {signal.platform}
            </span>
          )}
          <span className="text-[11px] text-white/35 ml-auto font-mono">
            {formatTimeAgo(signal.createdAt)}
          </span>
          <button className="text-white/30 hover:text-white/60 transition-colors ml-1">
            <Bookmark size={13} />
          </button>
        </div>

        {/* Row 2: Title */}
        <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2">
          {signal.title}
        </h3>

        {/* Row 3: Stats text */}
        {(signal.volume24h || signal.liquidity || signal.marketCap || signal.buys24h) && (
          <p className="text-[11px] text-white/40 leading-relaxed">
            {signal.platform && `${signal.tokenSymbol} on ${signal.platform} · `}
            {signal.volume24h ? `Vol: ${formatCompact(signal.volume24h)} · ` : ''}
            {signal.liquidity ? `Liq: ${formatCompact(signal.liquidity)} · ` : ''}
            {signal.marketCap ? `MCap: ${formatCompact(signal.marketCap)}` : ''}
            {signal.buys24h || signal.sells24h ? ` · ${signal.buys24h ?? 0}B/${signal.sells24h ?? 0}S` : ''}
            {signal.priceChange24h !== undefined ? ` · ${signal.priceChange24h >= 0 ? '+' : ''}${signal.priceChange24h.toFixed(1)}% 24h` : ''}
          </p>
        )}

        {/* Row 4: Price stats */}
        {signal.price !== undefined && (
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-white font-mono font-medium">{formatPrice(signal.price)}</span>
            {signal.marketCap ? <span className="text-white/50">{formatCompact(signal.marketCap)}</span> : null}
            {signal.priceChange24h !== undefined && (
              <span className={signal.priceChange24h >= 0 ? 'text-[#00C874]' : 'text-[#FF4444]'}>
                {signal.priceChange24h >= 0 ? '+' : ''}{signal.priceChange24h.toFixed(1)}%
              </span>
            )}
            {signal.liquidity ? <span className="text-white/40 ml-auto">Liq: {formatCompact(signal.liquidity)}</span> : null}
          </div>
        )}

        {/* Row 5: Trust score bar + risk label + View Proof */}
        <div className="flex items-center gap-3">
          {/* Trust bar */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${signal.trustScore}%`,
                  backgroundColor: riskConf.barColor,
                  boxShadow: `0 0 6px ${riskConf.barColor}80`,
                }}
              />
            </div>
            <span className="text-[12px] font-bold text-white">{signal.trustScore}</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: riskConf.color, backgroundColor: `${riskConf.color}18` }}
            >
              {riskConf.label}
            </span>
          </div>
          {/* View Proof */}
          <Link
            href={`/context/${signal.id}`}
            className="text-[12px] font-semibold whitespace-nowrap transition-colors"
            style={{ color: '#A855F7' }}
          >
            View Proof →
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/6" />

      {/* Footer: views / shares / likes */}
      <div className="px-4 py-2.5 flex items-center gap-5 text-[12px] text-white/35">
        <button className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
          <Eye size={12} />
          {signal.views}
        </button>
        <button className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
          <Share2 size={12} />
          {signal.shares}
        </button>
        <button className="flex items-center gap-1.5 hover:text-white/60 transition-colors">
          <Heart size={12} />
          {signal.likes}
        </button>
      </div>
    </div>
  );
}
