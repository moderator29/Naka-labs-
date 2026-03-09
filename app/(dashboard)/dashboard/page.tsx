'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SignalCard, { Signal } from '@/components/context/SignalCard';
import { RefreshCw, TrendingUp, Zap, BarChart2 } from 'lucide-react';

/* ── Lazy-load Markets + Predictions tabs ──────────────── */
const MarketsTab      = dynamic(() => import('@/components/context/MarketsTab'),      { ssr: false });
const PredictionsTab  = dynamic(() => import('@/components/context/PredictionsTab'),  { ssr: false });

type MainTab = 'context' | 'markets' | 'predictions';

/* ── Chain filters (with icons) ────────────────────────── */
const CHAIN_FILTERS = [
  { id: 'ALL',      label: 'All Chains', emoji: '🌐' },
  { id: 'SOLANA',   label: 'Solana',     emoji: '≡',  color: '#9945FF' },
  { id: 'ETHEREUM', label: 'Ethereum',   emoji: '◆',  color: '#627EEA' },
  { id: 'BSC',      label: 'BSC',        emoji: '◆',  color: '#F0B90B' },
  { id: 'BASE',     label: 'Base',       emoji: '⬡',  color: '#0052FF' },
  { id: 'ARBITRUM', label: 'Arbitrum',   emoji: '◈',  color: '#28A0F0' },
  { id: 'POLYGON',  label: 'Polygon',    emoji: '⬡',  color: '#8247E5' },
];

const SIGNAL_TYPE_FILTERS = [
  { id: 'ALL',              label: 'All'         },
  { id: 'WHALE_MOVEMENT',   label: 'Whale'       },
  { id: 'SMART_MONEY',      label: 'Smart Money' },
  { id: 'RUG_PULL_WARNING', label: 'Rug Warning' },
  { id: 'NEW_POOL',         label: 'New Pairs'   },
  { id: 'UNUSUAL_VOLUME',   label: 'Hype'        },
  { id: 'BUY',              label: 'Bullish'     },
  { id: 'SELL',             label: 'Bearish'     },
];

/* ── Rich mock signals ─────────────────────────────────── */
const MOCK_SIGNALS: Signal[] = [
  {
    id: '1', type: 'UNUSUAL_VOLUME', chain: 'SOLANA', platform: 'Pump.fun',
    tokenAddress: 'So11111111111111111111111111111111111111112',
    tokenSymbol: '$Nothing', tokenName: 'Nothing',
    title: 'New pair: Nothing ($Nothing) just launched on Pump.fun',
    summary: '$Nothing on Pump.fun · Vol: $433.9K · Liq: $13.6K · MCap: $30.0K · 4980B/4320S · -9.6% 24h',
    price: 0.00003000, priceChange24h: -9.6, volume24h: 433_900, liquidity: 14_000,
    marketCap: 30_009, buys24h: 4980, sells24h: 4320, trustScore: 65, riskLevel: 'MEDIUM',
    likes: 0, shares: 0, views: 0, createdAt: new Date(Date.now() - 30_000).toISOString(),
  },
  {
    id: '2', type: 'BUY', chain: 'SOLANA', platform: 'Solana Mainnet',
    tokenAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    tokenSymbol: 'SOL', tokenName: 'Solana',
    title: 'Solana: 193,287 txns processed — network demand up 23% in 1h',
    summary: 'Transaction throughput spike detected across Solana Mainnet. Driven by new meme season on Pump.fun.',
    price: 84.06, priceChange24h: 0.88, volume24h: 26_400_000, liquidity: 11_118_000,
    marketCap: 38_000_000_000, buys24h: 5528, sells24h: 5790, trustScore: 88, riskLevel: 'LOW',
    likes: 47, shares: 12, views: 843, createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: '3', type: 'WHALE_MOVEMENT', chain: 'ETHEREUM', platform: 'Uniswap v3',
    tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokenSymbol: 'WETH', tokenName: 'Wrapped Ether',
    title: 'Whale moved 10,000 ETH ($19.8M) to Binance — possible sell pressure',
    summary: 'Known Wintermute wallet transferred 10,000 ETH worth $19.8M to Binance hot wallet. Historical pattern: sell within 48h.',
    price: 1978, priceChange24h: -4.3, volume24h: 840_000_000, liquidity: 450_000_000,
    marketCap: 238_000_000_000, trustScore: 94, riskLevel: 'HIGH',
    amountUSD: 19_800_000, walletAddress: '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc12',
    likes: 247, shares: 89, views: 3420, createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: '4', type: 'RUG_PULL_WARNING', chain: 'BSC', platform: 'PancakeSwap',
    tokenAddress: '0x0000000000000000000000000000000000000001',
    tokenSymbol: 'SCAM', tokenName: 'ScamToken',
    title: 'CRITICAL: Dev wallet unlocked 40% of supply — rug risk imminent',
    summary: 'The deployer wallet just removed timelock on 40% of total supply. Liquidity only $180K. Exit now if holding.',
    price: 0.000012, priceChange24h: -45.2, volume24h: 820_000, liquidity: 180_000,
    marketCap: 450_000, trustScore: 22, riskLevel: 'CRITICAL',
    txHash: '0xdef789', likes: 521, shares: 312, views: 8900,
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: '5', type: 'SMART_MONEY', chain: 'BASE', platform: 'Aerodrome',
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    tokenSymbol: 'DEGEN', tokenName: 'Degen',
    title: 'Smart money loading DEGEN on Base — 3 alpha wallets in 2 hours',
    summary: 'Three wallets with >85% win rate collectively bought $1.2M of DEGEN in the last 2 hours. Historical pump cycle: 2-3 days.',
    price: 0.0082, priceChange24h: 12.4, volume24h: 9_800_000, liquidity: 4_200_000,
    marketCap: 780_000_000, buys24h: 8240, sells24h: 2100, trustScore: 87, riskLevel: 'LOW',
    amountUSD: 1_200_000, likes: 183, shares: 56, views: 2100,
    createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: '6', type: 'NEW_POOL', chain: 'SOLANA', platform: 'Raydium',
    tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'PEPE2', tokenName: 'Pepe 2.0',
    title: 'New Raydium pool: PEPE2/SOL launched with $450K initial liquidity',
    summary: 'Fresh Raydium AMM pool detected. Locked liquidity for 30 days. Dev doxxed. Low rug risk. Volume accelerating.',
    price: 0.00000450, priceChange24h: 340, volume24h: 2_100_000, liquidity: 450_000,
    marketCap: 4_500_000, buys24h: 12_480, sells24h: 3_120, trustScore: 78, riskLevel: 'MEDIUM',
    likes: 94, shares: 41, views: 1240, createdAt: new Date(Date.now() - 22 * 60_000).toISOString(),
  },
  {
    id: '7', type: 'SMART_MONEY', chain: 'ETHEREUM', platform: 'Uniswap v3',
    tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    tokenSymbol: 'UNI', tokenName: 'Uniswap',
    title: '5 smart money wallets accumulated 2.8M UNI in 6h — governance play',
    summary: 'Multiple alpha wallets with 80%+ win rate bought UNI ahead of potential Uniswap v4 launch. Catalyst: governance vote in 4 days.',
    price: 9.42, priceChange24h: 7.3, volume24h: 245_000_000, liquidity: 180_000_000,
    marketCap: 9_420_000_000, buys24h: 15_200, sells24h: 4_800, trustScore: 82, riskLevel: 'LOW',
    amountUSD: 26_376_000, likes: 312, shares: 98, views: 5400,
    createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
  {
    id: '8', type: 'UNUSUAL_VOLUME', chain: 'SOLANA', platform: 'Pump.fun',
    tokenAddress: 'WIF111111111111111111111111111111111111111',
    tokenSymbol: 'WIF', tokenName: 'dogwifhat',
    title: 'WIF volume explodes 340% in 2h — whale accumulation pattern detected',
    summary: 'Unusual trading volume spike on WIF across multiple DEXs. Buy:Sell ratio 72:28. Historical pattern: +40-80% within 48h.',
    price: 1.24, priceChange24h: -5.2, volume24h: 340_000_000, liquidity: 48_000_000,
    marketCap: 1_240_000_000, buys24h: 24_800, sells24h: 9_600, trustScore: 74, riskLevel: 'MEDIUM',
    likes: 156, shares: 44, views: 3100, createdAt: new Date(Date.now() - 48 * 60_000).toISOString(),
  },
  {
    id: '9', type: 'SELL', chain: 'ETHEREUM', platform: 'Binance',
    tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    tokenSymbol: 'BTC', tokenName: 'Bitcoin',
    title: 'Binance sees largest BTC outflow in 7 days — $890M moved to cold storage',
    summary: 'Major institutional cold storage movement detected. Historically bullish signal: institutions moving to self-custody typically precedes price appreciation.',
    price: 66_294, priceChange24h: -1.14, volume24h: 28_000_000_000, liquidity: 2_000_000_000,
    marketCap: 1_300_000_000_000, trustScore: 91, riskLevel: 'LOW',
    amountUSD: 890_000_000, likes: 892, shares: 341, views: 18_400,
    createdAt: new Date(Date.now() - 72 * 60_000).toISOString(),
  },
];

/* ── Main Dashboard / Context Feed Page ─────────────────── */
export default function DashboardPage() {
  const [activeTab, setActiveTab]         = useState<MainTab>('context');
  const [signals, setSignals]             = useState<Signal[]>([]);
  const [selectedChain, setSelectedChain] = useState('ALL');
  const [selectedType, setSelectedType]   = useState('ALL');
  const [loading, setLoading]             = useState(true);
  const [liveCount, setLiveCount]         = useState(20);

  /* Fetch signals */
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedChain !== 'ALL') params.set('chain', selectedChain);
      if (selectedType !== 'ALL')  params.set('type', selectedType);
      params.set('limit', '30');
      const res = await fetch(`/api/signals?${params}`);
      const data = await res.json();
      setSignals(data.signals?.length ? data.signals : MOCK_SIGNALS);
    } catch {
      setSignals(MOCK_SIGNALS);
    } finally {
      setLoading(false);
    }
  }, [selectedChain, selectedType]);

  useEffect(() => {
    if (activeTab === 'context') fetchSignals();
  }, [fetchSignals, activeTab]);

  /* Tick live count */
  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 2)), 12_000);
    return () => clearInterval(t);
  }, []);

  /* Filter */
  const filtered = signals.filter(s => {
    if (selectedChain !== 'ALL' && s.chain !== selectedChain) return false;
    if (selectedType  !== 'ALL' && s.type  !== selectedType)  return false;
    return true;
  });

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#030912' }}>

      {/* ── Main Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-0 flex-shrink-0">
        {/* Context Feed — orange/pink gradient active */}
        <button onClick={() => setActiveTab('context')}
          className={`relative px-5 py-2.5 rounded-2xl text-[13px] font-black transition-all flex items-center gap-2 ${
            activeTab === 'context'
              ? 'text-white shadow-[0_0_24px_rgba(255,107,53,0.4)]'
              : 'text-[#3D5270] hover:text-[#6B84A8]'
          }`}
          style={activeTab === 'context'
            ? { background: 'linear-gradient(135deg, #FF6B35, #FF3A80)' }
            : {}}>
          <Zap size={13} />
          Context Feed
          {activeTab === 'context' && liveCount > 0 && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{liveCount}</span>
          )}
        </button>

        {/* Markets */}
        <button onClick={() => setActiveTab('markets')}
          className={`px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'markets'
              ? 'bg-white/10 text-white border border-white/12'
              : 'text-[#3D5270] hover:text-[#6B84A8]'
          }`}>
          <BarChart2 size={13} />
          Markets
        </button>

        {/* Predictions */}
        <button onClick={() => setActiveTab('predictions')}
          className={`px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'predictions'
              ? 'bg-white/10 text-white border border-white/12'
              : 'text-[#3D5270] hover:text-[#6B84A8]'
          }`}>
          <TrendingUp size={13} />
          Predictions
        </button>
      </div>

      {/* Tab divider */}
      <div className="h-px mx-4 mt-3 bg-white/[0.06]" />

      {/* ── Context Feed content ─────────────────────────────── */}
      {activeTab === 'context' && (
        <div className="flex flex-col flex-1 px-4 pt-4">

          {/* Chain filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CHAIN_FILTERS.map(chain => {
              const active = selectedChain === chain.id;
              return (
                <button key={chain.id} onClick={() => setSelectedChain(chain.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    active ? 'text-white' : 'text-[#3D5270] hover:text-[#6B84A8] border border-white/[0.08]'
                  }`}
                  style={active
                    ? { background: 'linear-gradient(135deg, #FF6B35, #FF3A80)', boxShadow: '0 0 16px rgba(255,107,53,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-[14px]" style={active ? {} : { color: chain.color ?? '#6B84A8' }}>{chain.emoji}</span>
                  {chain.label}
                </button>
              );
            })}
          </div>

          {/* Signal type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mt-2 scrollbar-hide">
            {SIGNAL_TYPE_FILTERS.map(t => (
              <button key={t.id} onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedType === t.id
                    ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                    : 'text-[#3D5270] hover:text-[#6B84A8]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Live indicator + refresh */}
          <div className="flex items-center justify-between mt-3 mb-4">
            <div className="flex items-center gap-2 text-[12px] text-[#00C6FF]">
              <div className="w-2 h-2 rounded-full bg-[#00C6FF] animate-pulse" />
              <span>Live — {liveCount} events</span>
            </div>
            <button onClick={fetchSignals}
              className="p-1.5 text-[#3D5270] hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Signal cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 skeleton rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Zap size={40} className="text-[#3D5270] mb-4" />
              <p className="text-[#3D5270] text-[13px]">No signals found. Try changing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-24" />
        </div>
      )}

      {/* ── Markets Tab ─────────────────────────────────────── */}
      {activeTab === 'markets' && <MarketsTab />}

      {/* ── Predictions Tab ─────────────────────────────────── */}
      {activeTab === 'predictions' && <PredictionsTab />}
    </div>
  );
}
