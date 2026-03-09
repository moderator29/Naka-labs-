'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Briefcase, Plus, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { formatUSD, formatPercent, formatAddress, formatNumber } from '@/lib/utils/formatters';
import { usePortfolioStore } from '@/stores/portfolioStore';
import Link from 'next/link';

export default function PortfolioPage() {
  const account = useActiveAccount();
  const authenticated = !!account;
  const { holdings, totalValue, unrealizedPL, setHoldings, setLoading, isLoading } = usePortfolioStore();
  const [walletInput, setWalletInput] = useState('');
  const [trackedWallets, setTrackedWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'balance'>('value');

  useEffect(() => {
    if (account?.address) {
      setTrackedWallets([account.address]);
      setSelectedWallet(account.address);
      fetchPortfolio(account.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  async function fetchPortfolio(walletAddress: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio?address=${walletAddress}`);
      const data = await res.json();
      if (data.holdings) {
        setHoldings(data.holdings);
      }
    } catch {
      // ignore error
    } finally {
      setLoading(false);
    }
  }

  function addWallet() {
    const addr = walletInput.trim();
    if (!addr || trackedWallets.includes(addr)) return;
    setTrackedWallets((prev) => [...prev, addr]);
    setWalletInput('');
    setSelectedWallet(addr);
    fetchPortfolio(addr);
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (sortBy === 'value') return b.valueUSD - a.valueUSD;
    if (sortBy === 'change') return b.change24h - a.change24h;
    return b.balance - a.balance;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
        <Briefcase size={64} className="text-text-tertiary mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Portfolio Tracker</h2>
        <p className="text-text-secondary text-center max-w-md mb-6">
          Connect your wallet to track your multi-chain portfolio with real-time P&L, transaction history, and performance analytics.
        </p>
        <div className="text-text-tertiary text-sm">Connect wallet via the top navigation</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase size={24} className="text-neon-blue" />
              Portfolio
            </h1>
            <p className="text-text-secondary text-sm mt-1">Multi-wallet, multi-chain tracking</p>
          </div>
          <button
            onClick={() => selectedWallet && fetchPortfolio(selectedWallet)}
            disabled={isLoading}
            className="p-2 text-text-tertiary hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Wallet Management */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 mb-6">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWallet()}
              placeholder="Add wallet address (EVM or Solana)"
              className="flex-1 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-blue"
            />
            <button
              onClick={addWallet}
              className="bg-neon-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {trackedWallets.map((wallet) => (
              <button
                key={wallet}
                onClick={() => { setSelectedWallet(wallet); fetchPortfolio(wallet); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  selectedWallet === wallet
                    ? 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue'
                    : 'bg-bg-tertiary text-text-secondary hover:text-white'
                }`}
              >
                {formatAddress(wallet, 8)}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <div className="text-xs text-text-tertiary mb-1">Total Portfolio Value</div>
            <div className="text-3xl font-black font-mono text-white">{formatUSD(totalValue)}</div>
            <div className="text-xs text-text-tertiary mt-1">Across all tracked wallets</div>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <div className="text-xs text-text-tertiary mb-1">Unrealized P&L</div>
            <div className={`text-3xl font-black font-mono ${unrealizedPL >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
              {unrealizedPL >= 0 ? '+' : ''}{formatUSD(unrealizedPL)}
            </div>
            <div className="text-xs text-text-tertiary mt-1">Total open position gains/losses</div>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <div className="text-xs text-text-tertiary mb-1">Holdings</div>
            <div className="text-3xl font-black text-white">{holdings.length}</div>
            <div className="text-xs text-text-tertiary mt-1">Unique tokens tracked</div>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <h2 className="font-semibold text-white">Holdings</h2>
            <div className="flex gap-2">
              {(['value', 'change', 'balance'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    sortBy === sort ? 'bg-neon-blue/20 text-neon-blue' : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
            </div>
          ) : sortedHoldings.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase size={48} className="text-text-tertiary mx-auto mb-4" />
              <div className="text-text-secondary">No holdings found for this wallet</div>
              <div className="text-text-tertiary text-sm mt-1">Portfolio data is fetched in real-time</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-xs text-text-tertiary font-medium px-4 py-3">Token</th>
                    <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Price</th>
                    <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">24h</th>
                    <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Balance</th>
                    <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Value</th>
                    <th className="text-right text-xs text-text-tertiary font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((h) => (
                    <tr key={h.tokenAddress} className="border-b border-border-subtle hover:bg-bg-tertiary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-secondary">
                            {h.tokenSymbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{h.tokenSymbol}</div>
                            <div className="text-xs text-text-tertiary">{h.chain}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-white">
                        {formatUSD(h.priceUSD)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`flex items-center justify-end gap-1 text-sm ${h.change24h >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                          {h.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatPercent(h.change24h)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">
                        {formatNumber(h.balance)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-white">
                        {formatUSD(h.valueUSD)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/market?token=${h.tokenAddress}&chain=${h.chain}`}
                            className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-1 rounded hover:bg-neon-blue/30 transition-colors"
                          >
                            Trade
                          </Link>
                          <Link
                            href={`/scanner?address=${h.tokenAddress}`}
                            className="text-text-tertiary hover:text-white transition-colors"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
