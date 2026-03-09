'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { formatUSD, formatPercent } from '@/lib/utils/formatters';
import Link from 'next/link';

interface WatchlistToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

interface Watchlist {
  id: string;
  name: string;
  tokens: WatchlistToken[];
}

export default function WatchlistsPage() {
  const { authenticated } = usePrivy();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([
    { id: '1', name: 'My Watchlist', tokens: [] },
  ]);
  const [activeList, setActiveList] = useState('1');
  const [newListName, setNewListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WatchlistToken[]>([]);

  const activeTokens = watchlists.find((w) => w.id === activeList)?.tokens ?? [];

  async function searchTokens(q: string) {
    if (!q) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/market/chart?search=${encodeURIComponent(q)}&type=search`);
      const data = await res.json();
      setSearchResults(data.tokens ?? []);
    } catch {
      setSearchResults([]);
    }
  }

  function addToken(token: WatchlistToken) {
    setWatchlists((prev) =>
      prev.map((w) => {
        if (w.id !== activeList) return w;
        if (w.tokens.some((t) => t.tokenAddress === token.tokenAddress)) return w;
        return { ...w, tokens: [...w.tokens, token] };
      })
    );
    setSearchQuery('');
    setSearchResults([]);
  }

  function removeToken(tokenAddress: string) {
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === activeList
          ? { ...w, tokens: w.tokens.filter((t) => t.tokenAddress !== tokenAddress) }
          : w
      )
    );
  }

  function addList() {
    if (!newListName.trim()) return;
    const newList: Watchlist = {
      id: Date.now().toString(),
      name: newListName.trim(),
      tokens: [],
    };
    setWatchlists((prev) => [...prev, newList]);
    setActiveList(newList.id);
    setNewListName('');
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star size={24} className="text-bingo-yellow" />
            Watchlists
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar: List Selector */}
          <div className="w-48 flex-shrink-0 space-y-2">
            {watchlists.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveList(w.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeList === w.id
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-white'
                }`}
              >
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-text-tertiary">{w.tokens.length} tokens</div>
              </button>
            ))}
            <div className="pt-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addList()}
                placeholder="New list name..."
                className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-neon-blue"
              />
              <button
                onClick={addList}
                className="w-full mt-1 py-2 bg-bg-secondary border border-border-default rounded-lg text-xs text-text-secondary hover:text-white hover:border-neon-blue transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={12} />
                Create List
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search to add tokens */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); searchTokens(e.target.value); }}
                placeholder="Search and add tokens..."
                className="w-full bg-bg-secondary border border-border-default rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-bg-elevated border border-border-default rounded-xl shadow-xl z-10">
                  {searchResults.slice(0, 5).map((token) => (
                    <button
                      key={token.tokenAddress}
                      onClick={() => addToken(token)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white">{token.symbol}</div>
                          <div className="text-xs text-text-tertiary">{token.chain}</div>
                        </div>
                      </div>
                      <Plus size={14} className="text-neon-blue" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Token List */}
            <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
              {activeTokens.length === 0 ? (
                <div className="p-12 text-center">
                  <Star size={40} className="text-text-tertiary mx-auto mb-3" />
                  <div className="text-text-secondary">No tokens in this watchlist</div>
                  <div className="text-text-tertiary text-sm mt-1">Search above to add tokens</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left text-xs text-text-tertiary font-medium px-4 py-3">Token</th>
                      <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Price</th>
                      <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">24h</th>
                      <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTokens.map((token) => (
                      <tr key={token.tokenAddress} className="border-b border-border-subtle hover:bg-bg-tertiary transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold">
                              {token.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{token.symbol}</div>
                              <div className="text-xs text-text-tertiary">{token.chain}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-white">
                          {formatUSD(token.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`flex items-center justify-end gap-1 text-sm ${token.change24h >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                            {token.change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {formatPercent(token.change24h)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/market?token=${token.tokenAddress}&chain=${token.chain}`}
                              className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded hover:bg-neon-blue/30 transition-colors"
                            >
                              Trade
                            </Link>
                            <button
                              onClick={() => removeToken(token.tokenAddress)}
                              className="text-text-tertiary hover:text-bingo-orange transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
