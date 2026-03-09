'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SignalCard, { Signal } from '@/components/context/SignalCard';
import { RefreshCw, TrendingUp, Zap, BarChart2 } from 'lucide-react';

// Lazy-load the Markets & Predictions tabs to keep bundle split
const MarketsTab = dynamic(() => import('@/components/context/MarketsTab'), { ssr: false });
const PredictionsTab = dynamic(() => import('@/components/context/PredictionsTab'), { ssr: false });

type MainTab = 'context' | 'markets' | 'predictions';

const CHAIN_FILTERS = [
  { id: 'ALL',      label: 'All Chains', icon: '🌐' },
  { id: 'SOLANA',   label: 'Solana',     icon: '◎'  },
  { id: 'ETHEREUM', label: 'Ethereum',   icon: '⟠'  },
  { id: 'BSC',      label: 'BSC',        icon: '🟡' },
  { id: 'BASE',     label: 'Base',       icon: '🔵' },
  { id: 'ARBITRUM', label: 'Arbitrum',   icon: '🔷' },
  { id: 'POLYGON',  label: 'Polygon',    icon: '⬡'  },
];

const SIGNAL_TYPE_FILTERS = [
  { id: 'ALL',             label: 'All'         },
  { id: 'WHALE_MOVEMENT',  label: 'Whale'       },
  { id: 'SMART_MONEY',     label: 'Smart Money' },
  { id: 'RUG_PULL_WARNING',label: 'Rug Warning' },
  { id: 'NEW_POOL',        label: 'New Pairs'   },
  { id: 'UNUSUAL_VOLUME',  label: 'Hype'        },
  { id: 'BUY',             label: 'Bullish'     },
  { id: 'SELL',            label: 'Bearish'     },
];

export default function ContextFeedPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('context');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedChain, setSelectedChain] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(20);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedChain !== 'ALL') params.set('chain', selectedChain);
      if (selectedType !== 'ALL') params.set('type', selectedType);
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

  // Simulate live count ticking up
  useEffect(() => {
    const t = setInterval(() => setLiveCount((c) => c + Math.floor(Math.random() * 2)), 12000);
    return () => clearInterval(t);
  }, []);

  const filteredSignals = signals.filter((s) => {
    if (selectedChain !== 'ALL' && s.chain !== selectedChain) return false;
    if (selectedType !== 'ALL' && s.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
      {/* Main tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-0">
        <button
          onClick={() => setActiveTab('context')}
          className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'context'
              ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF3A80] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Zap size={14} />
            Context Feed
          </span>
        </button>
        <button
          onClick={() => setActiveTab('markets')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'markets'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart2 size={14} />
            Markets
          </span>
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'predictions'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <TrendingUp size={14} />
            Predictions
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/6 mx-4 mt-3" />

      {/* Context Feed content */}
      {activeTab === 'context' && (
        <div className="flex flex-col flex-1 px-4 pt-4">
          {/* Chain filter row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CHAIN_FILTERS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${
                  selectedChain === chain.id
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF3A80] text-white shadow-[0_0_12px_rgba(255,107,53,0.25)]'
                    : 'bg-white/6 text-white/50 hover:bg-white/10 hover:text-white border border-white/8'
                }`}
              >
                <span className="text-[13px]">{chain.icon}</span>
                {chain.label}
              </button>
            ))}
          </div>

          {/* Signal type filter row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-2 scrollbar-hide">
            {SIGNAL_TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  selectedType === t.id
                    ? 'bg-white/12 text-white border border-white/20'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Live indicator + event count */}
          <div className="flex items-center justify-between mt-3 mb-4">
            <div className="flex items-center gap-2 text-[12px] text-[#00E5FF]">
              <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span>Live — {liveCount} events</span>
            </div>
            <button
              onClick={fetchSignals}
              className="p-1.5 text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/6"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-56 bg-white/4 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Zap size={40} className="text-white/15 mb-4" />
              <p className="text-white/40 text-sm">No signals found. Try changing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
          <div className="h-8" />
        </div>
      )}

      {activeTab === 'markets' && <MarketsTab />}
      {activeTab === 'predictions' && <PredictionsTab />}
    </div>
  );
}

// Rich mock signals matching the Steinz design
const MOCK_SIGNALS: Signal[] = [
  {
    id: '1',
    type: 'UNUSUAL_VOLUME',
    chain: 'SOLANA',
    platform: 'Pump.fun',
    tokenAddress: 'So11111111111111111111111111111111111111112',
    tokenSymbol: '$Nothing',
    tokenName: 'Nothing',
    title: 'New pair: Nothing ($Nothing) just launched on Pump.fun',
    summary: '$Nothing on Pump.fun · Vol: $433.9K · Liq: $13.6K · MCap: $30.0K · -9.6% 24h',
    price: 0.00003000,
    priceChange24h: -9.6,
    volume24h: 433_900,
    liquidity: 14_000,
    marketCap: 30_009,
    buys24h: 4980,
    sells24h: 4320,
    trustScore: 65,
    riskLevel: 'MEDIUM',
    likes: 0,
    shares: 0,
    views: 0,
    createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'BUY',
    chain: 'SOLANA',
    platform: 'Solana Mainnet',
    tokenAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    tokenSymbol: 'SOL',
    tokenName: 'Solana',
    title: 'Solana: 193,287 txns processed — network demand up 23% in 1h',
    summary: 'Transaction throughput spike detected across Solana Mainnet. Driven by new meme season on Pump.fun.',
    price: 84.06,
    priceChange24h: 0.88,
    volume24h: 26_400_000,
    liquidity: 11_118_000,
    marketCap: 38_000_000_000,
    buys24h: 5528,
    sells24h: 5790,
    trustScore: 88,
    riskLevel: 'LOW',
    likes: 47,
    shares: 12,
    views: 843,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'WHALE_MOVEMENT',
    chain: 'ETHEREUM',
    platform: 'Uniswap v3',
    tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokenSymbol: 'WETH',
    tokenName: 'Wrapped Ether',
    title: 'Whale moved 10,000 ETH ($31.8M) to Binance — possible sell pressure',
    summary: 'Known Wintermute wallet transferred 10,000 ETH worth $31.8M to Binance hot wallet. Historical pattern: sell within 48h.',
    price: 3180,
    priceChange24h: -2.38,
    volume24h: 840_000_000,
    liquidity: 450_000_000,
    marketCap: 382_000_000_000,
    trustScore: 94,
    riskLevel: 'HIGH',
    amountUSD: 31_800_000,
    walletAddress: '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc12',
    likes: 247,
    shares: 89,
    views: 3420,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'RUG_PULL_WARNING',
    chain: 'BSC',
    platform: 'PancakeSwap',
    tokenAddress: '0x0000000000000000000000000000000000000001',
    tokenSymbol: 'SCAM',
    tokenName: 'ScamToken',
    title: 'CRITICAL: Dev wallet unlocked 40% of supply — rug risk imminent',
    summary: 'The deployer wallet just removed timelock on 40% of total supply. Liquidity only $180K. Exit now if holding.',
    price: 0.000012,
    priceChange24h: -45.2,
    volume24h: 820_000,
    liquidity: 180_000,
    marketCap: 450_000,
    trustScore: 22,
    riskLevel: 'CRITICAL',
    txHash: '0xdef789',
    likes: 521,
    shares: 312,
    views: 8900,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'SMART_MONEY',
    chain: 'BASE',
    platform: 'Aerodrome',
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    tokenSymbol: 'DEGEN',
    tokenName: 'Degen',
    title: 'Smart money loading DEGEN on Base — 3 alpha wallets in 2 hours',
    summary: 'Three wallets with >85% win rate collectively bought $1.2M of DEGEN in the last 2 hours. Historical pump cycle: 2-3 days.',
    price: 0.0082,
    priceChange24h: 12.4,
    volume24h: 9_800_000,
    liquidity: 4_200_000,
    marketCap: 780_000_000,
    buys24h: 8240,
    sells24h: 2100,
    trustScore: 87,
    riskLevel: 'LOW',
    amountUSD: 1_200_000,
    likes: 183,
    shares: 56,
    views: 2100,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'NEW_POOL',
    chain: 'SOLANA',
    platform: 'Raydium',
    tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'PEPE2',
    tokenName: 'Pepe 2.0',
    title: 'New Raydium pool: PEPE2/SOL launched with $450K initial liquidity',
    summary: 'Fresh Raydium AMM pool detected. Locked liquidity for 30 days. Dev doxxed. Low rug risk. Volume accelerating.',
    price: 0.00000450,
    priceChange24h: 340,
    volume24h: 2_100_000,
    liquidity: 450_000,
    marketCap: 4_500_000,
    buys24h: 12_480,
    sells24h: 3_120,
    trustScore: 78,
    riskLevel: 'MEDIUM',
    likes: 94,
    shares: 41,
    views: 1240,
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
];
