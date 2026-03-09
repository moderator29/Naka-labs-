'use client';

import { useState } from 'react';
import { Users, UserPlus, TrendingUp, Star, Activity } from 'lucide-react';
import { formatUSD, formatPercent, formatAddress } from '@/lib/utils/formatters';

interface Trader {
  id: string;
  address: string;
  username: string;
  pnl30d: number;
  winRate: number;
  followers: number;
  isFollowing: boolean;
  profileType: string;
  topToken: string;
  topPnl: number;
  verified: boolean;
}

const MOCK_TRADERS: Trader[] = [
  { id: '1', address: '0x9507c04b10486547584c37bcbd931b2a4fee9a41', username: 'CryptoWhale99', pnl30d: 847_000, winRate: 78, followers: 12400, isFollowing: false, profileType: 'Smart Money', topToken: 'ETH', topPnl: 420_000, verified: true },
  { id: '2', address: '0x1234567890123456789012345678901234567890', username: 'DeFiDegen', pnl30d: 234_000, winRate: 65, followers: 5600, isFollowing: true, profileType: 'Degen', topToken: 'PEPE', topPnl: 180_000, verified: false },
  { id: '3', address: '0xabcdef1234567890abcdef1234567890abcdef12', username: 'SolanaKing', pnl30d: 1_200_000, winRate: 82, followers: 28900, isFollowing: false, profileType: 'Whale', topToken: 'SOL', topPnl: 650_000, verified: true },
  { id: '4', address: '0x5555555555555555555555555555555555555555', username: 'BaseBuilder', pnl30d: 98_000, winRate: 71, followers: 3200, isFollowing: false, profileType: 'Smart Money', topToken: 'BRETT', topPnl: 75_000, verified: false },
];

export default function SocialPage() {
  const [traders, setTraders] = useState<Trader[]>(MOCK_TRADERS);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'following'>('leaderboard');

  function toggleFollow(id: string) {
    setTraders((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, isFollowing: !t.isFollowing, followers: t.isFollowing ? t.followers - 1 : t.followers + 1 }
          : t
      )
    );
  }

  const displayedTraders = activeTab === 'following' ? traders.filter((t) => t.isFollowing) : traders;

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-neon-blue" />
            Social Trading
          </h1>
          <p className="text-text-secondary text-sm mt-1">Follow top traders and copy their intelligence</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['leaderboard', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-neon-blue text-white'
                  : 'bg-bg-secondary border border-border-default text-text-secondary hover:text-white'
              }`}
            >
              {tab === 'following' ? `Following (${traders.filter((t) => t.isFollowing).length})` : 'Leaderboard'}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-electric-blue">$1.2M</div>
              <div className="text-xs text-text-tertiary mt-1">Highest 30d PnL</div>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">82%</div>
              <div className="text-xs text-text-tertiary mt-1">Top Win Rate</div>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-bingo-yellow">28.9K</div>
              <div className="text-xs text-text-tertiary mt-1">Most Followed</div>
            </div>
          </div>
        )}

        {/* Trader Cards */}
        <div className="space-y-3">
          {displayedTraders.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-12 text-center">
              <Users size={48} className="text-text-tertiary mx-auto mb-4" />
              <div className="text-text-secondary">Not following anyone yet</div>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="mt-4 text-neon-blue hover:underline text-sm"
              >
                Browse leaderboard →
              </button>
            </div>
          ) : (
            displayedTraders.map((trader, index) => (
              <div
                key={trader.id}
                className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(10,30,255,0.1)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    {activeTab === 'leaderboard' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                        index === 0 ? 'bg-bingo-yellow text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {index + 1}
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neon-blue to-electric-blue flex items-center justify-center text-white font-bold">
                      {trader.username.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{trader.username}</span>
                        {trader.verified && (
                          <Star size={12} className="text-bingo-yellow fill-bingo-yellow" />
                        )}
                        <span className="text-xs text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">
                          {trader.profileType}
                        </span>
                      </div>
                      <div className="text-xs text-text-tertiary font-mono mt-0.5">
                        {formatAddress(trader.address, 8)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden md:flex gap-6 text-sm">
                      <div className="text-center">
                        <div className={`font-bold font-mono ${trader.pnl30d >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                          +{formatUSD(trader.pnl30d)}
                        </div>
                        <div className="text-xs text-text-tertiary">30d PnL</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white">{trader.winRate}%</div>
                        <div className="text-xs text-text-tertiary">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-text-secondary">{(trader.followers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-text-tertiary">Followers</div>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => toggleFollow(trader.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        trader.isFollowing
                          ? 'bg-bg-tertiary border border-border-default text-text-secondary hover:border-bingo-orange hover:text-bingo-orange'
                          : 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue hover:text-white'
                      }`}
                    >
                      {trader.isFollowing ? (
                        <>Following</>
                      ) : (
                        <><UserPlus size={14} /> Follow</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Top trade */}
                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
                  <div className="flex items-center gap-2">
                    <Activity size={10} />
                    Best trade: <span className="text-white font-semibold">{trader.topToken}</span>
                    <span className="text-electric-blue font-mono">+{formatUSD(trader.topPnl)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={10} />
                    <span>{trader.followers.toLocaleString()} followers</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
