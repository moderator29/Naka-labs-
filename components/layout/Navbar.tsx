'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Bell, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils/formatters';
import { useState } from 'react';

export default function Navbar() {
  const { authenticated, user, login, logout } = usePrivy();
  const [showDropdown, setShowDropdown] = useState(false);

  const walletAddress = user?.wallet?.address;
  const displayName = user?.email?.address || (walletAddress ? formatAddress(walletAddress) : '');

  return (
    <header className="h-14 bg-bg-secondary border-b border-border-default flex items-center px-6 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search tokens, wallets..."
          className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-neon-blue transition-colors"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Price Ticker */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <span className="text-text-tertiary">ETH</span>
          <span className="text-white">$3,247.82</span>
          <span className="text-electric-blue">+2.4%</span>
        </div>

        {/* Alerts */}
        <button className="relative p-2 text-text-tertiary hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-bingo-orange rounded-full" />
        </button>

        {/* Auth */}
        {authenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 hover:border-neon-blue transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-blue to-electric-blue" />
              <span className="text-sm text-white hidden sm:block">{displayName}</span>
              <ChevronDown size={14} className="text-text-tertiary" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-elevated border border-border-default rounded-xl shadow-xl z-50">
                <div className="p-3 border-b border-border-subtle">
                  <div className="text-xs text-text-tertiary">Connected Wallet</div>
                  <div className="text-sm font-mono text-white mt-1">
                    {walletAddress ? formatAddress(walletAddress, 8) : 'No wallet'}
                  </div>
                </div>
                <div className="p-1">
                  <Link
                    href="/portfolio"
                    className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-bg-tertiary rounded-lg transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => { logout(); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-bingo-orange hover:bg-bg-tertiary rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={login}
            className="bg-neon-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
