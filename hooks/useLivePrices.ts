'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LivePrice {
  price:     number;
  change24h: number;
  change1h:  number;
  volume24h: number;
  marketCap: number;
}

type PriceMap = Record<string, LivePrice>;

const DEFAULT_INTERVAL = 30_000; // 30 seconds

/**
 * Hook that polls /api/prices every 30s and returns live prices.
 *
 * Usage:
 *   const { prices, loading } = useLivePrices(['BTC', 'ETH', 'SOL']);
 *   prices['BTC']?.price  // current BTC price
 */
export function useLivePrices(
  symbols: string[],
  intervalMs = DEFAULT_INTERVAL
): { prices: PriceMap; loading: boolean; refresh: () => void } {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const symbolsKey = symbols.slice().sort().join(',');

  const fetchPrices = useCallback(async () => {
    if (!symbols.length) return;
    try {
      const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
      if (res.ok) {
        const data: PriceMap = await res.json();
        setPrices(prev => ({ ...prev, ...data }));
      }
    } catch { /* silent - keep stale data */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    setLoading(true);
    fetchPrices();
    timerRef.current = setInterval(fetchPrices, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPrices, intervalMs]);

  return { prices, loading, refresh: fetchPrices };
}

/**
 * Convenience hook for a single token price
 */
export function useTokenPrice(symbol: string) {
  const { prices, loading, refresh } = useLivePrices([symbol]);
  return { ...prices[symbol], loading, refresh };
}
