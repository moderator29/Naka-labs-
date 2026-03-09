import { NextRequest, NextResponse } from 'next/server';
import { getTokenOHLC, getTokenPairs, searchTokens } from '@/lib/api/dexscreener';
import { getTopCoins } from '@/lib/api/coingecko';

const INTERVAL_MAP: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
  '1W': 'W',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const address = searchParams.get('address');
  const interval = searchParams.get('interval') ?? '1h';
  const chain = searchParams.get('chain') ?? 'ethereum';
  const search = searchParams.get('search');
  const symbol = searchParams.get('symbol') ?? 'BTC';

  try {
    // Overview: top coins for dashboard
    if (type === 'overview') {
      const coins = await getTopCoins(8);
      return NextResponse.json({
        coins: coins.map((c) => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          price: c.current_price,
          change24h: c.price_change_percentage_24h,
          volume24h: c.total_volume,
        })),
      });
    }

    // Search tokens
    if (type === 'search' && search) {
      const pairs = await searchTokens(search);
      const tokens = pairs.slice(0, 10).map((p) => ({
        tokenAddress: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        chain: p.chainId.toUpperCase(),
        price: parseFloat(p.priceUsd ?? '0'),
        change24h: p.priceChange?.h24 ?? 0,
        volume24h: p.volume?.h24 ?? 0,
        marketCap: p.marketCap ?? 0,
        liquidity: p.liquidity?.usd ?? 0,
      }));
      return NextResponse.json({ tokens });
    }

    // OHLCV data for chart
    if (address) {
      const now = Math.floor(Date.now() / 1000);
      const intervalSeconds: Record<string, number> = {
        '1m': 60 * 200, '5m': 300 * 200, '15m': 900 * 200,
        '1h': 3600 * 200, '4h': 14400 * 200, '1D': 86400 * 200, '1W': 604800 * 100,
      };
      const from = now - (intervalSeconds[interval] ?? 3600 * 200);

      // Get pair address first
      const pairs = await getTokenPairs(address);
      if (!pairs || pairs.length === 0) {
        return NextResponse.json({ candles: MOCK_CANDLES(100), volume: MOCK_VOLUME(100) });
      }

      const pair = pairs[0];
      const resolution = INTERVAL_MAP[interval] ?? '60';

      try {
        const ohlcv = await getTokenOHLC(pair.chainId, pair.pairAddress, resolution, from, now);
        if (ohlcv.t && ohlcv.t.length > 0) {
          const candles = ohlcv.t.map((time, i) => ({
            time,
            open: ohlcv.o[i],
            high: ohlcv.h[i],
            low: ohlcv.l[i],
            close: ohlcv.c[i],
          }));
          const volume = ohlcv.t.map((time, i) => ({
            time,
            value: ohlcv.v[i],
            color: ohlcv.c[i] >= ohlcv.o[i] ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 107, 53, 0.5)',
          }));
          return NextResponse.json({ candles, volume, pair });
        }
      } catch {
        // Fall through to mock data
      }
    }

    // Mock data fallback (or BTC/default)
    const count = 200;
    return NextResponse.json({
      candles: MOCK_CANDLES(count),
      volume: MOCK_VOLUME(count),
    });
  } catch (error) {
    console.error('Market chart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

function MOCK_CANDLES(count: number) {
  const now = Math.floor(Date.now() / 1000);
  let price = 3247 + Math.random() * 100;
  const candles = [];
  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.02;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    price = close;
    candles.push({ time: now - i * 3600, open, high, low, close });
  }
  return candles;
}

function MOCK_VOLUME(count: number) {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, i) => ({
    time: now - (count - 1 - i) * 3600,
    value: Math.random() * 5_000_000 + 1_000_000,
    color: Math.random() > 0.5 ? 'rgba(0, 229, 255, 0.5)' : 'rgba(255, 107, 53, 0.5)',
  }));
}
