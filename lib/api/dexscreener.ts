const BASE_URL = 'https://api.dexscreener.com';

export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number };
  priceChange: { h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

export async function searchTokens(query: string): Promise<DexPair[]> {
  const res = await fetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.pairs ?? [];
}

export async function getTokenPairs(tokenAddress: string): Promise<DexPair[]> {
  const res = await fetch(`${BASE_URL}/latest/dex/tokens/${tokenAddress}`);
  const data = await res.json();
  return data.pairs ?? [];
}

export async function getPairByAddress(chainId: string, pairAddress: string): Promise<DexPair | null> {
  const res = await fetch(`${BASE_URL}/latest/dex/pairs/${chainId}/${pairAddress}`);
  const data = await res.json();
  return data.pair ?? null;
}

export async function getTokenOHLC(
  chainId: string,
  pairAddress: string,
  resolution: string,
  from: number,
  to: number
): Promise<{ o: number[]; h: number[]; l: number[]; c: number[]; v: number[]; t: number[] }> {
  const res = await fetch(
    `${BASE_URL}/latest/dex/ohlcv/${chainId}/${pairAddress}?resolution=${resolution}&from=${from}&to=${to}`
  );
  const data = await res.json();
  return data.data ?? { o: [], h: [], l: [], c: [], v: [], t: [] };
}

export async function getTrendingTokens(): Promise<DexPair[]> {
  const res = await fetch(`${BASE_URL}/latest/dex/tokens/trending`);
  const data = await res.json();
  return data.pairs ?? [];
}
