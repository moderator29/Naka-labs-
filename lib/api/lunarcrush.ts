const API_KEYS = [
  process.env.LUNARCRUSH_API_KEY_1,
  process.env.LUNARCRUSH_API_KEY_2,
  process.env.LUNARCRUSH_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextKey(): string {
  const key = API_KEYS[currentKeyIndex % API_KEYS.length];
  currentKeyIndex++;
  return key;
}

async function lunarFetch(endpoint: string): Promise<unknown> {
  const attempts = API_KEYS.length;

  for (let i = 0; i < attempts; i++) {
    const key = getNextKey();
    try {
      const res = await fetch(`https://lunarcrush.com/api4/public${endpoint}`, {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
      });

      if (res.status === 429) continue; // Rate limited, try next key
      if (!res.ok) throw new Error(`LunarCrush error: ${res.status}`);

      return res.json();
    } catch {
      if (i === attempts - 1) throw new Error('All LunarCrush API keys exhausted');
    }
  }
  throw new Error('LunarCrush request failed');
}

export async function getCoinSocialData(symbol: string) {
  return lunarFetch(`/coins/${symbol.toLowerCase()}/v1`);
}

export async function getTopSocialCoins(limit = 50) {
  return lunarFetch(`/coins/list/v2?sort=galaxy_score&limit=${limit}`);
}

export async function getCoinInfluencers(symbol: string) {
  return lunarFetch(`/coins/${symbol.toLowerCase()}/influencers/v1`);
}

export async function getTrendingTopics() {
  return lunarFetch('/topic/trending/v1');
}
