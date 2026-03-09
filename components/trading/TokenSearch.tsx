'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { TokenInfo } from '@/stores/tradingStore';
import { formatUSD } from '@/lib/utils/formatters';
import { searchTokens } from '@/lib/api/dexscreener';

interface TokenSearchProps {
  onSelect: (token: TokenInfo) => void;
  selectedToken?: TokenInfo | null;
}

export default function TokenSearch({ onSelect, selectedToken }: TokenSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const pairs = await searchTokens(query);
        const tokens: TokenInfo[] = pairs.slice(0, 10).map((p) => ({
          address: p.baseToken.address,
          symbol: p.baseToken.symbol,
          name: p.baseToken.name,
          chain: p.chainId.toUpperCase(),
          price: parseFloat(p.priceUsd ?? '0'),
          change24h: p.priceChange?.h24 ?? 0,
          volume24h: p.volume?.h24 ?? 0,
          marketCap: p.marketCap ?? 0,
          liquidity: p.liquidity?.usd ?? 0,
          pairAddress: p.pairAddress,
          chainId: p.chainId,
          logo: p.info?.imageUrl,
        }));
        setResults(tokens);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(token: TokenInfo) {
    onSelect(token);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative flex-1 max-w-xl">
      <div className="flex items-center gap-2 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 focus-within:border-neon-blue transition-colors">
        <Search size={14} className="text-text-tertiary flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedToken ? `${selectedToken.symbol}/${selectedToken.chain}` : 'Search tokens by name, symbol, or address...'}
          className="flex-1 bg-transparent text-white text-sm placeholder-text-tertiary focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="text-text-tertiary hover:text-white">
            <X size={14} />
          </button>
        )}
        {loading && (
          <div className="w-3 h-3 border border-neon-blue border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-bg-elevated border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {results.map((token) => (
              <button
                key={`${token.address}-${token.chain}`}
                onClick={() => handleSelect(token)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-bold text-text-secondary border border-border-subtle flex-shrink-0">
                  {token.symbol.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{token.symbol}</span>
                    <span className="text-xs text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">
                      {token.chain}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary truncate">{token.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">{formatUSD(token.price)}</div>
                  <div className={`text-xs flex items-center gap-1 justify-end ${token.change24h >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                    {token.change24h >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {Math.abs(token.change24h).toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
