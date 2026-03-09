import { NextRequest, NextResponse } from 'next/server';

// In production, this would query Prisma + on-chain data sources
// For now, returns realistic mock data + integrates with DexScreener for new pools

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get('chain');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') ?? '30');
  const id = searchParams.get('id');

  try {
    // Fetch single signal
    if (id) {
      const signal = MOCK_SIGNALS.find((s) => s.id === id);
      if (!signal) return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
      return NextResponse.json({ signal });
    }

    // Filter signals
    let signals = [...MOCK_SIGNALS];

    if (chain && chain !== 'ALL') {
      signals = signals.filter((s) => s.chain === chain);
    }

    if (type && type !== 'ALL') {
      signals = signals.filter((s) => s.type === type);
    }

    // Randomize order slightly to simulate live feed
    signals = signals.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      signals: signals.slice(0, limit),
      total: signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Signals error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Create new signal (admin only in production)
  try {
    const body = await req.json();
    const signal = {
      id: Date.now().toString(),
      ...body,
      likes: 0,
      shares: 0,
      views: 0,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ signal, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
  }
}

const MOCK_SIGNALS = [
  {
    id: '1',
    type: 'WHALE_MOVEMENT',
    chain: 'ETHEREUM',
    tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokenSymbol: 'ETH',
    tokenName: 'Ethereum',
    title: 'Whale moved 10,000 ETH ($32.4M) to Binance — potential selling pressure',
    summary: 'A known whale wallet (Arkham: Wintermute) transferred 10,000 ETH worth $32.4M to a Binance hot wallet. Historical pattern for this wallet shows 70% chance of partial sell-off within 48 hours.',
    amountUSD: 32_400_000,
    trustScore: 94,
    walletAddress: '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    txHash: '0xabc123def456',
    likes: 247,
    shares: 89,
    views: 3420,
    riskLevel: 'HIGH',
    proofData: { blockNumber: 19500000 },
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'SMART_MONEY',
    chain: 'BASE',
    tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    tokenSymbol: 'BRETT',
    tokenName: 'Brett (Based)',
    title: 'Smart money accumulating BRETT — 3 high-win-rate wallets bought $1.2M',
    summary: 'Three wallets with >85% historical win rate have collectively purchased $1.2M of BRETT in the past 2 hours. All three wallets were early to PEPE and SHIB pumps.',
    amountUSD: 1_200_000,
    trustScore: 87,
    likes: 183,
    shares: 56,
    views: 2100,
    riskLevel: 'MEDIUM',
    proofData: {},
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'RUG_PULL_WARNING',
    chain: 'BSC',
    tokenAddress: '0x0000000000000000000000000000000000000001',
    tokenSymbol: 'SCAM',
    tokenName: 'ScamToken',
    title: 'CRITICAL: Dev wallet unlocked 40% of supply — exit immediately',
    summary: 'The deployer wallet just removed a time lock on 40% of the total SCAM token supply. Liquidity is only $180K. All indicators point to an imminent rug pull. Sell all positions immediately.',
    amountUSD: 0,
    trustScore: 99,
    likes: 521,
    shares: 312,
    views: 8900,
    riskLevel: 'CRITICAL',
    proofData: {},
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'NEW_POOL',
    chain: 'ETHEREUM',
    tokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    tokenSymbol: 'NEWT',
    tokenName: 'New Token',
    title: 'New Uniswap V3 pool with $500K initial liquidity — early entry opportunity',
    summary: 'A new ERC-20 token launched with $500K in initial liquidity on Uniswap V3. Contract is verified, ownership renounced, and liquidity is locked for 12 months. High social buzz detected.',
    amountUSD: 500_000,
    trustScore: 72,
    likes: 94,
    shares: 38,
    views: 1250,
    riskLevel: 'MEDIUM',
    proofData: {},
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'BUY',
    chain: 'SOLANA',
    tokenAddress: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    tokenName: 'Solana',
    title: 'Large SOL accumulation by known VC wallet — $8.2M purchase',
    summary: 'A wallet associated with a top-tier crypto VC fund purchased 45,000 SOL ($8.2M) across 5 transactions. This wallet was also an early buyer of BONK, JTO, and WIF.',
    amountUSD: 8_200_000,
    trustScore: 91,
    likes: 356,
    shares: 142,
    views: 5600,
    riskLevel: 'LOW',
    proofData: {},
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'UNUSUAL_VOLUME',
    chain: 'ARBITRUM',
    tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    tokenSymbol: 'ARB',
    tokenName: 'Arbitrum',
    title: 'ARB volume 8x above average — unusual accumulation pattern detected',
    summary: 'Arbitrum (ARB) is experiencing 800% above-average trading volume in the past 3 hours. On-chain analysis shows systematic accumulation by 12 distinct wallets, suggesting coordinated buying.',
    amountUSD: 4_500_000,
    trustScore: 78,
    likes: 145,
    shares: 62,
    views: 2800,
    riskLevel: 'MEDIUM',
    proofData: {},
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'DEV_ACTIVITY',
    chain: 'ETHEREUM',
    tokenAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    tokenSymbol: 'PEPE',
    tokenName: 'Pepe',
    title: 'PEPE dev wallet received 500B tokens — monitor for distribution',
    summary: 'The official PEPE development wallet received 500 billion PEPE tokens from the deployer address. While no sell has occurred, this warrants close monitoring. Historically these transfers precede partnership announcements.',
    amountUSD: 2_100_000,
    trustScore: 65,
    likes: 89,
    shares: 31,
    views: 1700,
    riskLevel: 'MEDIUM',
    proofData: {},
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    type: 'LIQUIDITY_ADD',
    chain: 'POLYGON',
    tokenAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    tokenSymbol: 'WMATIC',
    tokenName: 'Wrapped Matic',
    title: '$3.5M liquidity added to MATIC/USDC on QuickSwap — bullish signal',
    summary: 'A institutional wallet just added $3.5M in liquidity to the MATIC/USDC pool on QuickSwap. This is one of the largest single liquidity additions in the past 30 days and signals confidence in MATIC price stability.',
    amountUSD: 3_500_000,
    trustScore: 82,
    likes: 112,
    shares: 44,
    views: 2100,
    riskLevel: 'LOW',
    proofData: {},
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    type: 'SELL',
    chain: 'ETHEREUM',
    tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    tokenSymbol: 'WBTC',
    tokenName: 'Wrapped Bitcoin',
    title: 'Known BTC whale sold $15M WBTC — near-term bearish signal',
    summary: 'A whale with a 78% accuracy track record on sell timing just sold $15M in WBTC. This wallet correctly called the Nov 2022 and Apr 2024 tops. Current sell may indicate expectation of short-term correction.',
    amountUSD: 15_000_000,
    trustScore: 88,
    likes: 298,
    shares: 115,
    views: 4300,
    riskLevel: 'HIGH',
    proofData: {},
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];
