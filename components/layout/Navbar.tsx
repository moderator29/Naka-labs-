'use client';

import { useActiveAccount, useActiveWallet, useDisconnect, useConnectModal } from 'thirdweb/react';
import { Bell, Search, ChevronDown, Copy, LogOut, Settings, Briefcase, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils/formatters';
import { useState, useEffect, useRef } from 'react';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

/* ── Theme switcher stored in localStorage ─────────────── */
type Theme = 'dark' | 'light' | 'bingo';

function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('sl-theme') as Theme) || 'dark';
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-bingo');
    if (t === 'light') html.classList.add('theme-light');
    if (t === 'bingo') html.classList.add('theme-bingo');
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('sl-theme', t);
    applyTheme(t);
  }

  return { theme, setTheme };
}

/* ── Live price ticker data ────────────────────────────── */
interface TickerPrice {
  symbol: string;
  price: string;
  change: number;
}

const FALLBACK_PRICES: TickerPrice[] = [
  { symbol: 'BTC', price: '$67,240', change: 2.4 },
  { symbol: 'ETH', price: '$1,978', change: -4.3 },
  { symbol: 'SOL', price: '$84.06', change: 0.88 },
  { symbol: 'BNB', price: '$627', change: 0.5 },
];

/* ── Wallet Dropdown ───────────────────────────────────── */
function WalletDropdown({
  address,
  onClose,
  onDisconnect,
}: {
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-[#0D1A2B] border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(27,79,255,0.1)] z-50 overflow-hidden"
      style={{ animation: 'fadeInScale 0.18s ease-out' }}>
      {/* Header */}
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4FFF] via-[#3B82F6] to-[#00C6FF] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{address.slice(2, 4).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#3D5270] mb-0.5">Connected Wallet</div>
            <div className="text-sm font-mono text-[#EEF2FF] font-medium">{formatAddress(address, 8)}</div>
          </div>
          <button onClick={onClose} className="text-[#3D5270] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={copyAddress}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B84A8] hover:text-white hover:bg-white/5 transition-all"
        >
          <Copy size={14} />
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
        <Link
          href="/portfolio"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B84A8] hover:text-white hover:bg-white/5 transition-all"
        >
          <Briefcase size={14} />
          My Wallet
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B84A8] hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings size={14} />
          Settings
        </Link>
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6B84A8] hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink size={14} />
          View on Explorer
        </a>
        <div className="border-t border-white/5 mt-1 pt-1">
          <button
            onClick={onDisconnect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#FF3E3E] hover:bg-[#FF3E3E]/8 transition-all"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Search Overlay ────────────────────────────────────── */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestions = [
    { label: 'Bitcoin', symbol: 'BTC', href: '/token/bitcoin' },
    { label: 'Ethereum', symbol: 'ETH', href: '/token/ethereum' },
    { label: 'Solana', symbol: 'SOL', href: '/token/solana' },
    { label: 'Market Terminal', symbol: '', href: '/market' },
    { label: 'Context Feed', symbol: '', href: '/context' },
    { label: 'Security Scanner', symbol: '', href: '/scanner' },
  ].filter(s =>
    !query || s.label.toLowerCase().includes(query.toLowerCase()) || s.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4"
      onClick={onClose}>
      <div
        className="w-full max-w-xl bg-[#0D1A2B] border border-white/10 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(27,79,255,0.1)] overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.18s ease-out' }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
          <Search size={16} className="text-[#3D5270] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tokens, wallets, or navigate..."
            className="flex-1 bg-transparent text-[#EEF2FF] text-[14px] placeholder-[#3D5270] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#3D5270] hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[#3D5270] bg-white/5 border border-white/8">
            ESC
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {suggestions.map(s => (
            <Link
              key={s.href}
              href={s.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0"
            >
              {s.symbol ? (
                <div className="w-8 h-8 rounded-full bg-[#1B4FFF]/20 border border-[#1B4FFF]/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#7BA4FF]">{s.symbol.slice(0, 2)}</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center">
                  <Search size={12} className="text-[#3D5270]" />
                </div>
              )}
              <div>
                <div className="text-[13px] font-semibold text-[#EEF2FF]">{s.label}</div>
                {s.symbol && <div className="text-[11px] text-[#3D5270]">{s.symbol}</div>}
              </div>
            </Link>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-white/5 text-[11px] text-[#3D5270] flex items-center gap-4">
          <span>↩ Select</span>
          <span>↑↓ Navigate</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Navbar ───────────────────────────────────────── */
export default function Navbar() {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { connect } = useConnectModal();
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [prices] = useState<TickerPrice[]>(FALLBACK_PRICES);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const authenticated = !!account;
  const walletAddress = account?.address ?? '';

  function login() {
    connect({ client: thirdwebClient, wallets, theme: 'dark' });
  }

  function logout() {
    if (activeWallet) disconnect(activeWallet);
    setShowDropdown(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Keyboard shortcut: Cmd/Ctrl + K for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const THEME_TABS: { id: Theme; label: string }[] = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'bingo', label: 'Bingo' },
  ];

  return (
    <>
      <header className="h-14 bg-[#07101F]/95 backdrop-blur-xl border-b border-white/[0.07] flex items-center px-4 gap-3 flex-shrink-0 relative z-40">

        {/* ── Logo (mobile only, desktop is in sidebar) ── */}
        <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF] flex items-center justify-center shadow-[0_0_16px_rgba(27,79,255,0.5)]">
            <span className="text-white text-[10px] font-black tracking-tight">SL</span>
          </div>
          <span className="text-[#EEF2FF] font-bold text-[15px] tracking-tight">Steinz<span className="text-[#1B4FFF]">.</span></span>
        </Link>

        {/* ── Theme Mode Switcher ── */}
        <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl p-0.5 gap-0.5 flex-shrink-0">
          {THEME_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                theme === t.id
                  ? t.id === 'bingo'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD23F] text-black'
                    : t.id === 'light'
                    ? 'bg-white text-[#0A1628]'
                    : 'bg-[#1B4FFF] text-white shadow-[0_0_12px_rgba(27,79,255,0.4)]'
                  : 'text-[#3D5270] hover:text-[#6B84A8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Live Price Ticker ── */}
        <div className="hidden md:flex items-center gap-4 text-[11px] font-mono ml-1 overflow-hidden flex-1 max-w-xs">
          {prices.map(p => (
            <div key={p.symbol} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[#3D5270]">{p.symbol}</span>
              <span className="text-[#EEF2FF] font-medium">{p.price}</span>
              <span className={p.change >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}>
                {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {/* Search button */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl px-3 py-2 text-[12px] text-[#3D5270] hover:text-[#6B84A8] transition-all"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:flex items-center text-[10px] text-[#3D5270] bg-white/5 px-1.5 py-0.5 rounded border border-white/8">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center text-[#3D5270] hover:text-[#EEF2FF] hover:bg-white/5 rounded-xl transition-all">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B35] rounded-full border-2 border-[#07101F]" />
          </button>

          {/* Auth button */}
          {authenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(p => !p)}
                className="flex items-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-[#1B4FFF]/30 rounded-xl px-3 py-2 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF] flex-shrink-0" />
                <span className="text-[12px] font-medium text-[#EEF2FF] hidden sm:block font-mono">
                  {formatAddress(walletAddress, 4)}
                </span>
                <ChevronDown size={12} className={`text-[#3D5270] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <WalletDropdown
                  address={walletAddress}
                  onClose={() => setShowDropdown(false)}
                  onDisconnect={logout}
                />
              )}
            </div>
          ) : (
            <button
              onClick={login}
              className="btn-primary px-4 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
        </div>
      </header>

      {/* Search overlay */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
