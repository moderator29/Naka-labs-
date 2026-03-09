const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;

const headers: Record<string, string> = API_KEY
  ? { 'x-cg-demo-api-key': API_KEY }
  : {};

export async function getCoinPrice(coinId: string): Promise<{ usd: number; usd_24h_change: number }> {
  const res = await fetch(
    `${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
    { headers, next: { revalidate: 30 } }
  );
  const data = await res.json();
  return data[coinId] ?? { usd: 0, usd_24h_change: 0 };
}

export async function getTopCoins(limit = 100): Promise<CoinData[]> {
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
    { headers, next: { revalidate: 60 } }
  );
  return res.json();
}

export async function getCoinOHLC(coinId: string, days = 1): Promise<number[][]> {
  const res = await fetch(
    `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
    { headers, next: { revalidate: 60 } }
  );
  return res.json();
}

export async function searchCoins(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`,
    { headers }
  );
  const data = await res.json();
  return data.coins ?? [];
}

export async function getCoinData(coinId: string): Promise<CoinDetail> {
  const res = await fetch(
    `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
    { headers, next: { revalidate: 60 } }
  );
  return res.json();
}

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: { large: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    circulating_supply: number;
    total_supply: number;
    ath: { usd: number };
    atl: { usd: number };
  };
  description: { en: string };
  contract_address?: string;
  platforms?: Record<string, string>;
}
