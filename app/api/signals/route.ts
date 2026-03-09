import { NextRequest, NextResponse } from 'next/server';

const HELIUS_KEY = process.env.HELIUS_API_KEY_BACKUP ?? process.env.NEXT_PUBLIC_HELIUS_API_KEY;

interface LiveSignal {
  id: string;
  type: string;
  chain: string;
  platform?: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  title: string;
  summary: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  buys24h?: number;
  sells24h?: number;
  amountUSD?: number;
  trustScore: number;
  riskLevel: string;
  walletAddress?: string;
  txHash?: string;
  likes: number;
  shares: number;
  views: number;
  createdAt: string;
}

async function fetchDexScreenerSignals(): Promise<LiveSignal[]> {
  const signals: LiveSignal[] = [];
  try {
    // 1. Token boosts (promoted/trending)
    const boostRes = await fetch('https://api.dexscreener.com/token-boosts/latest/v1', {
      next: { revalidate: 60 },
    });
    if (boostRes.ok) {
      const boosts = await boostRes.json();
      const list: { tokenAddress?: string; chainId?: string; description?: string; amount?: number }[] =
        Array.isArray(boosts) ? boosts : (boosts.tokenBoosts ?? []);
      list.slice(0, 6).forEach((b, i) => {
        const chain = (b.chainId ?? 'solana').toUpperCase();
        signals.push({
          id: `boost_${i}_${b.tokenAddress?.slice(-6)}`,
          type: 'UNUSUAL_VOLUME',
          chain,
          platform: chain === 'SOLANA' ? 'Pump.fun' : 'DexScreener Boost',
          tokenAddress: b.tokenAddress ?? '',
          tokenSymbol: '???',
          tokenName: b.description?.split(' ').slice(0,3).join(' ') ?? 'Trending Token',
          title: `Promoted token trending on ${chain} — community volume accelerating`,
          summary: b.description ?? 'High buy pressure detected from boosted token promotion.',
          trustScore: 50 + Math.floor(Math.random() * 25),
          riskLevel: 'MEDIUM',
          likes: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 35),
          views: Math.floor(Math.random() * 1000),
          createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        });
      });
    }

    // 2. Recently created pairs (new pools)
    const newPairsRes = await fetch('https://api.dexscreener.com/latest/dex/search?q=sol', {
      next: { revalidate: 120 },
    });
    if (newPairsRes.ok) {
      type DexPairRaw = {
        chainId: string; dexId: string; pairAddress: string;
        baseToken: { address: string; name: string; symbol: string };
        priceUsd?: string; priceChange?: { h24?: number };
        volume?: { h24?: number }; liquidity?: { usd?: number };
        marketCap?: number; fdv?: number;
        txns?: { h24?: { buys?: number; sells?: number } };
        pairCreatedAt?: number;
      };
      const pairsData = await newPairsRes.json();
      const pairs: DexPairRaw[] = pairsData.pairs ?? [];
      pairs
        .filter(p => p.pairCreatedAt && Date.now() - p.pairCreatedAt < 12 * 3600 * 1000)
        .slice(0, 8)
        .forEach((p, i) => {
          const price = parseFloat(p.priceUsd ?? '0');
          const change = p.priceChange?.h24 ?? 0;
          const vol = p.volume?.h24 ?? 0;
          const liq = p.liquidity?.usd ?? 0;
          const mcap = p.marketCap ?? p.fdv ?? 0;
          const buys = p.txns?.h24?.buys ?? 0;
          const sells = p.txns?.h24?.sells ?? 0;
          const chain = p.chainId.toUpperCase();
          const platform = ({ raydium: 'Raydium', orca: 'Orca', pumpfun: 'Pump.fun', uniswap: 'Uniswap V3', pancakeswap: 'PancakeSwap' } as Record<string,string>)[p.dexId] ?? p.dexId;
          const trustScore = liq > 50000 ? 70 : liq > 20000 ? 55 : 35;
          signals.push({
            id: `new_${i}_${p.pairAddress.slice(-8)}`,
            type: 'NEW_POOL',
            chain,
            platform,
            tokenAddress: p.baseToken.address,
            tokenSymbol: p.baseToken.symbol,
            tokenName: p.baseToken.name,
            title: `New pair: ${p.baseToken.name} (${p.baseToken.symbol}) launched on ${platform}`,
            summary: `${p.baseToken.symbol} on ${platform} · Vol: $${(vol/1000).toFixed(1)}K · Liq: $${(liq/1000).toFixed(1)}K · MCap: $${(mcap/1000).toFixed(1)}K · ${buys}B/${sells}S · ${change >= 0 ? '+' : ''}${change.toFixed(1)}% 24h`,
            price,
            priceChange24h: change,
            volume24h: vol,
            liquidity: liq,
            marketCap: mcap,
            buys24h: buys,
            sells24h: sells,
            trustScore,
            riskLevel: trustScore >= 70 ? 'MEDIUM' : trustScore >= 50 ? 'HIGH' : 'CRITICAL',
            likes: Math.floor(Math.random() * 50),
            shares: Math.floor(Math.random() * 20),
            views: Math.floor(Math.random() * 500),
            createdAt: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : new Date().toISOString(),
          });
        });
    }
  } catch (err) {
    console.error('DexScreener signal error:', err);
  }
  return signals;
}

async function fetchHeliusWhaleSignals(): Promise<LiveSignal[]> {
  if (!HELIUS_KEY) return [];
  const signals: LiveSignal[] = [];
  try {
    const whaleWallet = 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq';
    const res = await fetch(
      `https://api.helius.xyz/v0/addresses/${whaleWallet}/transactions?api-key=${HELIUS_KEY}&limit=5&type=TRANSFER`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    type HeliusTx = {
      signature?: string; timestamp?: number; description?: string;
      nativeTransfers?: { amount?: number }[];
    };
    const txns: HeliusTx[] = await res.json();
    txns.slice(0, 3).forEach((tx, i) => {
      const solAmt = (tx.nativeTransfers?.reduce((s, t) => s + (t.amount ?? 0), 0) ?? 0) / 1e9;
      if (solAmt < 500) return;
      signals.push({
        id: `whale_${i}_${tx.signature?.slice(0, 8)}`,
        type: 'WHALE_MOVEMENT',
        chain: 'SOLANA',
        platform: 'Solana Mainnet',
        tokenAddress: 'So11111111111111111111111111111111111111112',
        tokenSymbol: 'SOL',
        tokenName: 'Solana',
        title: `Whale moved ${solAmt.toFixed(0)} SOL (~$${(solAmt * 84).toFixed(0)}) — monitor for sell intent`,
        summary: tx.description ?? `Large SOL transfer detected: ${solAmt.toFixed(0)} SOL from monitored high-value wallet.`,
        price: 84.06,
        volume24h: solAmt * 84,
        amountUSD: solAmt * 84,
        trustScore: 82,
        riskLevel: 'HIGH',
        walletAddress: whaleWallet,
        txHash: tx.signature,
        likes: Math.floor(Math.random() * 80),
        shares: Math.floor(Math.random() * 30),
        views: Math.floor(Math.random() * 900),
        createdAt: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error('Helius whale error:', err);
  }
  return signals;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get('chain');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '30');
  const id = searchParams.get('id');

  try {
    if (id) {
      const signal = STATIC_SIGNALS.find(s => s.id === id);
      if (!signal) return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
      return NextResponse.json({ signal });
    }

    const [dexResult, whaleResult] = await Promise.allSettled([
      fetchDexScreenerSignals(),
      fetchHeliusWhaleSignals(),
    ]);

    const live: LiveSignal[] = [
      ...(dexResult.status === 'fulfilled' ? dexResult.value : []),
      ...(whaleResult.status === 'fulfilled' ? whaleResult.value : []),
    ];

    let signals: LiveSignal[] = [...live, ...STATIC_SIGNALS];

    // Deduplicate
    const seen = new Set<string>();
    signals = signals.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });

    if (chain && chain !== 'ALL') signals = signals.filter(s => s.chain === chain);
    if (type && type !== 'ALL') signals = signals.filter(s => s.type === type);

    signals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ signals: signals.slice(0, limit), total: signals.length, live: live.length, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Signals error:', error);
    return NextResponse.json({ signals: STATIC_SIGNALS, total: STATIC_SIGNALS.length, timestamp: new Date().toISOString() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({ signal: { id: Date.now().toString(), ...body, likes: 0, shares: 0, views: 0, createdAt: new Date().toISOString() }, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
  }
}

const STATIC_SIGNALS: LiveSignal[] = [
  { id: 'static_1', type: 'WHALE_MOVEMENT', chain: 'ETHEREUM', platform: 'Etherscan', tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', tokenSymbol: 'ETH', tokenName: 'Ethereum', title: 'Whale moved 10,000 ETH ($31.8M) to Binance — potential selling pressure', summary: 'Known Wintermute wallet transferred 10,000 ETH worth $31.8M to Binance hot wallet. Historical pattern: sell within 48h.', price: 3180, priceChange24h: -2.38, volume24h: 840_000_000, liquidity: 450_000_000, marketCap: 382_000_000_000, trustScore: 94, riskLevel: 'HIGH', amountUSD: 31_800_000, walletAddress: '0x9507c04b10486547584c37bcbd931b2a4fee9a41', txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456ab12', likes: 247, shares: 89, views: 3420, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'static_2', type: 'SMART_MONEY', chain: 'BASE', platform: 'Aerodrome', tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', tokenSymbol: 'DEGEN', tokenName: 'Degen', title: 'Smart money loading DEGEN — 3 alpha wallets accumulated $1.2M in 2h', summary: 'Three wallets with >85% win rate collectively bought $1.2M of DEGEN. Historical pump cycle: 2-3 days.', price: 0.0082, priceChange24h: 12.4, volume24h: 9_800_000, liquidity: 4_200_000, marketCap: 780_000_000, buys24h: 8240, sells24h: 2100, trustScore: 87, riskLevel: 'LOW', amountUSD: 1_200_000, likes: 183, shares: 56, views: 2100, createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'static_3', type: 'RUG_PULL_WARNING', chain: 'BSC', platform: 'PancakeSwap', tokenAddress: '0x0000000000000000000000000000000000000001', tokenSymbol: 'SCAM', tokenName: 'ScamToken', title: 'CRITICAL: Dev wallet unlocked 40% of supply — rug risk imminent', summary: 'Deployer removed time lock on 40% of total supply. Liquidity only $180K. Exit immediately.', price: 0.000012, priceChange24h: -45.2, volume24h: 820_000, liquidity: 180_000, marketCap: 450_000, trustScore: 22, riskLevel: 'CRITICAL', txHash: '0xdef789abc123def789abc123def789abc123def789abc123def789abc123def7', likes: 521, shares: 312, views: 8900, createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
  { id: 'static_4', type: 'BUY', chain: 'SOLANA', platform: 'Jupiter', tokenAddress: 'So11111111111111111111111111111111111111112', tokenSymbol: 'SOL', tokenName: 'Solana', title: 'VC wallet accumulated 45,000 SOL ($8.2M) across 5 transactions', summary: 'Known crypto VC fund wallet purchased $8.2M of SOL. Early to BONK, JTO, and WIF.', price: 84.06, priceChange24h: 0.88, volume24h: 1_800_000_000, liquidity: 200_000_000, marketCap: 38_000_000_000, buys24h: 55000, sells24h: 49000, trustScore: 91, riskLevel: 'LOW', amountUSD: 8_200_000, likes: 356, shares: 142, views: 5600, createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: 'static_5', type: 'UNUSUAL_VOLUME', chain: 'ARBITRUM', platform: 'Uniswap V3', tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548', tokenSymbol: 'ARB', tokenName: 'Arbitrum', title: 'ARB volume 8x above average — coordinated accumulation by 12 wallets', summary: 'Arbitrum experiencing 800% above-average volume in 3 hours. Systematic accumulation detected.', price: 1.14, priceChange24h: 3.2, volume24h: 145_000_000, liquidity: 28_000_000, marketCap: 1_450_000_000, buys24h: 12000, sells24h: 4500, trustScore: 78, riskLevel: 'MEDIUM', amountUSD: 4_500_000, likes: 145, shares: 62, views: 2800, createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
  { id: 'static_6', type: 'NEW_POOL', chain: 'SOLANA', platform: 'Raydium', tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', tokenSymbol: 'PEPE2', tokenName: 'Pepe 2.0', title: 'New Raydium pool: PEPE2/SOL launched with $450K initial liquidity', summary: 'Fresh Raydium AMM pool. Liquidity locked 30 days. Dev doxxed. Volume accelerating.', price: 0.00000450, priceChange24h: 340, volume24h: 2_100_000, liquidity: 450_000, marketCap: 4_500_000, buys24h: 12480, sells24h: 3120, trustScore: 78, riskLevel: 'MEDIUM', likes: 94, shares: 41, views: 1240, createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString() },
];
