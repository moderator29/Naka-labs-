import { NextRequest, NextResponse } from 'next/server';
import { searchTokens, getTokenPairs } from '@/lib/api/dexscreener';

const CG_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
const CG_BASE = 'https://api.coingecko.com/api/v3';
const CG_HEADERS: Record<string, string> = CG_KEY ? { 'x-cg-demo-api-key': CG_KEY } : {};

// symbol → CoinGecko coin ID
const CG_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  USDC: 'usd-coin', USDT: 'tether', ARB: 'arbitrum', MATIC: 'matic-network',
  AVAX: 'avalanche-2', LINK: 'chainlink', UNI: 'uniswap', AAVE: 'aave',
  OP: 'optimism', NEAR: 'near', ATOM: 'cosmos', DOT: 'polkadot',
  WIF: 'dogwifcoin', BONK: 'bonk', PEPE: 'pepe', ZEC: 'zcash', LTC: 'litecoin',
  DEGEN: 'degen-base', HYPE: 'hyperliquid',
};

const INTERVAL_DAYS: Record<string, number> = {
  '1m': 1, '5m': 1, '15m': 2, '1h': 7, '4h': 30, '1D': 365, '1W': 730,
};
const INTERVAL_SECS: Record<string, number> = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1D': 86400, '1W': 604800,
};

// ── CoinGecko OHLC ──
async function cgOHLC(coinId: string, days: number) {
  const res = await fetch(`${CG_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`, {
    headers: CG_HEADERS, next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`CG OHLC ${res.status}`);
  const raw: [number, number, number, number, number][] = await res.json();
  return raw.map(([ts, o, h, l, c]) => ({ time: Math.floor(ts / 1000), open: o, high: h, low: l, close: c }));
}

// ── CoinGecko volume ──
async function cgVolume(coinId: string, days: number) {
  const res = await fetch(`${CG_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`, {
    headers: CG_HEADERS, next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data: { total_volumes: [number, number][] } = await res.json();
  return data.total_volumes.map(([ts, vol]) => ({
    time: Math.floor(ts / 1000), value: vol,
    color: Math.random() > 0.5 ? 'rgba(0,229,255,0.5)' : 'rgba(255,107,53,0.5)',
  }));
}

// ── DexScreener unofficial chart endpoint ──
async function dexChart(chainId: string, pairAddress: string, resolution: string) {
  const url = `https://io.dexscreener.com/dex/chart/amm/v3/${chainId}/${pairAddress}?res=${resolution}&cb=0`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`DexScreener chart ${res.status}`);
  const data: { bars?: { t: number; o: number; h: number; l: number; c: number }[] } = await res.json();
  return (data.bars ?? []).map(b => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c }));
}

// ── Synthesize OHLC from single price + 24h change ──
function synthesize(price: number, change24h: number, count: number, secs: number) {
  const now = Math.floor(Date.now() / 1000);
  const startPrice = price / (1 + change24h / 100);
  let p = startPrice;
  const drift = (price - startPrice) / count;
  return Array.from({ length: count }, (_, i) => {
    const open = p;
    const close = Math.max(open * 0.01, open + (Math.random() - 0.47) * open * 0.025 + drift);
    const high = Math.max(open, close) * (1 + Math.random() * 0.008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.008);
    p = close;
    return { time: now - (count - 1 - i) * secs, open, high, low, close };
  });
}

function fallbackCandles(count: number, secs: number) {
  return synthesize(3247 + Math.random() * 200, (Math.random() - 0.5) * 10, count, secs);
}

function fallbackVolume(candles: { time: number; close: number; open: number }[], baseVol = 5_000_000) {
  return candles.map(c => ({
    time: c.time, value: baseVol / candles.length * (0.5 + Math.random()),
    color: c.close >= c.open ? 'rgba(0,229,255,0.5)' : 'rgba(255,107,53,0.5)',
  }));
}

// ── Route ──
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type');
  const address = sp.get('address');
  const interval = sp.get('interval') ?? '1h';
  const search = sp.get('search');
  const symbol = (sp.get('symbol') ?? 'BTC').toUpperCase();

  const resMap: Record<string, string> = { '1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1D':'D','1W':'W' };
  const days = INTERVAL_DAYS[interval] ?? 7;
  const secs = INTERVAL_SECS[interval] ?? 3600;

  try {
    // Overview
    if (type === 'overview') {
      const r = await fetch(`${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&sparkline=false`, { headers: CG_HEADERS, next: { revalidate: 120 } });
      const coins = r.ok ? await r.json() : [];
      return NextResponse.json({ coins: coins.map((c: { symbol: string; name: string; current_price: number; price_change_percentage_24h: number; total_volume: number }) => ({ symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, change24h: c.price_change_percentage_24h, volume24h: c.total_volume })) });
    }

    // Search
    if (type === 'search' && search) {
      const pairs = await searchTokens(search);
      return NextResponse.json({ tokens: pairs.slice(0, 10).map(p => ({ tokenAddress: p.baseToken.address, symbol: p.baseToken.symbol, name: p.baseToken.name, chain: p.chainId.toUpperCase(), price: parseFloat(p.priceUsd ?? '0'), change24h: p.priceChange?.h24 ?? 0, volume24h: p.volume?.h24 ?? 0, marketCap: p.marketCap ?? 0, liquidity: p.liquidity?.usd ?? 0, pairAddress: p.pairAddress })) });
    }

    // Token address → DexScreener
    const isRealAddress = address && address.length > 10 && !['0x0','0x1','0x2','0x3','0x4','0x5','0x6','0x7','0x8','0x9','0xa','0xb'].includes(address);
    if (isRealAddress) {
      try {
        const pairs = await getTokenPairs(address!);
        if (pairs?.length) {
          const pair = pairs[0];
          const currentPrice = parseFloat(pair.priceUsd ?? '1');
          const change = pair.priceChange?.h24 ?? 0;
          // Try unofficial DexScreener chart first
          try {
            const candles = await dexChart(pair.chainId, pair.pairAddress, resMap[interval] ?? '60');
            if (candles.length > 0) {
              return NextResponse.json({ candles, volume: fallbackVolume(candles, pair.volume?.h24), pair });
            }
          } catch { /* fallthrough */ }
          // Synthesize from pair data
          const candles = synthesize(currentPrice, change, 200, secs);
          return NextResponse.json({ candles, volume: fallbackVolume(candles, pair.volume?.h24), pair });
        }
      } catch (err) {
        console.error('DexScreener error:', err);
      }
    }

    // Major symbol → CoinGecko (real OHLC)
    const coinId = CG_IDS[symbol];
    if (coinId) {
      try {
        const [candles, volData] = await Promise.all([cgOHLC(coinId, days), cgVolume(coinId, days)]);
        if (candles.length > 0) {
          const volMap = new Map(volData.map(v => [v.time, v]));
          const volume = candles.map(c => volMap.get(c.time) ?? { time: c.time, value: 1_000_000, color: c.close >= c.open ? 'rgba(0,229,255,0.5)' : 'rgba(255,107,53,0.5)' });
          return NextResponse.json({ candles, volume });
        }
      } catch (err) {
        console.error('CoinGecko error:', err);
      }
    }

    // DexScreener search fallback
    try {
      const pairs = await searchTokens(symbol);
      if (pairs.length) {
        const pair = pairs[0];
        const candles = synthesize(parseFloat(pair.priceUsd ?? '1'), pair.priceChange?.h24 ?? 0, 200, secs);
        return NextResponse.json({ candles, volume: fallbackVolume(candles, pair.volume?.h24) });
      }
    } catch { /* final fallback */ }

    const candles = fallbackCandles(200, secs);
    return NextResponse.json({ candles, volume: fallbackVolume(candles) });
  } catch (error) {
    console.error('Chart route error:', error);
    const candles = fallbackCandles(200, secs);
    return NextResponse.json({ candles, volume: fallbackVolume(candles) });
  }
}
