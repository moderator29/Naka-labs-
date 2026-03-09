import { NextRequest, NextResponse } from 'next/server';

const CG_KEY  = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
const CG_BASE = 'https://api.coingecko.com/api/v3';
const CG_HDR: Record<string, string> = CG_KEY ? { 'x-cg-demo-api-key': CG_KEY } : {};

// Symbol → CoinGecko ID
const CG_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  MATIC: 'matic-network', AVAX: 'avalanche-2', ARB: 'arbitrum',
  LINK: 'chainlink', UNI: 'uniswap', AAVE: 'aave', OP: 'optimism',
  NEAR: 'near', WIF: 'dogwifcoin', BONK: 'bonk', PEPE: 'pepe',
  ZEC: 'zcash', LTC: 'litecoin', DEGEN: 'degen-base', HYPE: 'hyperliquid',
  DOT: 'polkadot', ATOM: 'cosmos',
};

/**
 * GET /api/prices?symbols=BTC,ETH,SOL
 * Returns: { BTC: { price, change24h, change1h }, ETH: {...}, ... }
 * Cache: 30 seconds
 */
export async function GET(req: NextRequest) {
  const symbolsParam = new URL(req.url).searchParams.get('symbols') ?? 'BTC,ETH,SOL';
  const symbols = symbolsParam.toUpperCase().split(',').filter(Boolean).slice(0, 50);

  // Map symbols to CoinGecko IDs
  const cgIds = symbols
    .map(s => CG_IDS[s])
    .filter(Boolean);

  try {
    if (cgIds.length > 0) {
      const res = await fetch(
        `${CG_BASE}/coins/markets?vs_currency=usd&ids=${cgIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h`,
        { headers: CG_HDR, next: { revalidate: 30 } }
      );

      if (res.ok) {
        const coins = await res.json();
        const result: Record<string, { price: number; change24h: number; change1h: number; volume24h: number; marketCap: number }> = {};

        for (const coin of coins) {
          const symbol = coin.symbol.toUpperCase();
          result[symbol] = {
            price:      coin.current_price ?? 0,
            change24h:  coin.price_change_percentage_24h ?? 0,
            change1h:   coin.price_change_percentage_1h_in_currency ?? 0,
            volume24h:  coin.total_volume ?? 0,
            marketCap:  coin.market_cap ?? 0,
          };
        }

        // Also pull DexScreener prices for symbols not in CoinGecko
        const missing = symbols.filter(s => !CG_IDS[s]);
        if (missing.length > 0) {
          await Promise.allSettled(
            missing.map(async (sym) => {
              try {
                const r = await fetch(
                  `https://api.dexscreener.com/latest/dex/search?q=${sym}`,
                  { next: { revalidate: 30 } }
                );
                if (!r.ok) return;
                const data = await r.json();
                const pair = data.pairs?.[0];
                if (pair) {
                  result[sym] = {
                    price:     parseFloat(pair.priceUsd ?? '0'),
                    change24h: pair.priceChange?.h24 ?? 0,
                    change1h:  pair.priceChange?.h1 ?? 0,
                    volume24h: pair.volume?.h24 ?? 0,
                    marketCap: pair.marketCap ?? 0,
                  };
                }
              } catch { /* silent */ }
            })
          );
        }

        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10' },
        });
      }
    }
  } catch (err) {
    console.error('Price API error:', err);
  }

  // Fallback — return zeros so UI doesn't break
  const fallback: Record<string, { price: number; change24h: number; change1h: number }> = {};
  for (const sym of symbols) fallback[sym] = { price: 0, change24h: 0, change1h: 0 };
  return NextResponse.json(fallback);
}
