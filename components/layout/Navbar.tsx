'use client';

import { useActiveAccount, useActiveWallet, useDisconnect, useConnectModal } from 'thirdweb/react';
import {
  Bell, Search, ChevronDown, Copy, LogOut, Settings,
  Briefcase, ExternalLink, X, Menu, User,
} from 'lucide-react';
import Link from 'next/link';
import { formatAddress } from '@/lib/utils/formatters';
import { useState, useEffect, useRef } from 'react';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

/* ── Steinz Spiral Logo ────────────────────────────────── */
function SteinzLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: 'conic-gradient(from 0deg, #1B4FFF, #A855F7, #FF3A80, #00C6FF, #1B4FFF)', padding: 2, borderRadius: '50%' }}>
        <div className="w-full h-full rounded-full" style={{ background: '#07101F' }} />
      </div>
      {/* Spiral inside */}
      <div className="absolute inset-[3px] rounded-full flex items-center justify-center"
        style={{ background: 'radial-gradient(circle at 35% 35%, #4F46E5, #1B4FFF 40%, #0A1EFF 70%, #050E1A)' }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" />
          <path d="M12 4c-2.2 0-4 1.8-4 4 0 1.1.45 2.1 1.17 2.83C7.72 11.55 7 12.7 7 14c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.3-.72-2.45-1.17-3.17C16.55 10.1 17 9.1 17 8c0-2.2-1.8-4-4-4z" fill="none" />
          <circle cx="12" cy="12" r="1.5" fill="white" opacity="0.9" />
          <path d="M12 5.5A6.5 6.5 0 0 1 18.5 12" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M12 7.5A4.5 4.5 0 0 1 16.5 12" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M12 9.5A2.5 2.5 0 0 1 14.5 12" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}

/* ── Theme switcher ─────────────────────────────────────── */
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

/* ── Price ticker data ──────────────────────────────────── */
interface TickerItem { symbol: string; price: string; change: number }
const TICKER_ITEMS: TickerItem[] = [
  { symbol: 'BTC',  price: '$66,294', change: -1.14 },
  { symbol: 'ETH',  price: '$1,954',  change: -2.38 },
  { symbol: 'USDT', price: '$0.9998', change:  0.01 },
  { symbol: 'SOL',  price: '$84.06',  change:  0.88 },
  { symbol: 'BNB',  price: '$627.28', change:  0.50 },
  { symbol: 'HYPE', price: '$31.71',  change:  2.97 },
  { symbol: 'NEAR', price: '$1.35',   change: 20.50 },
  { symbol: 'DEGEN',price: '$0.0082', change: 12.40 },
];

/* ── Hamburger Menu Drawer ──────────────────────────────── */
function HamburgerDrawer({
  onClose,
  onLogin,
  account,
  onLogout,
}: {
  onClose: () => void;
  onLogin: () => void;
  account: string | null;
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      {/* Panel */}
      <div
        className="w-72 h-full flex flex-col border-l border-white/[0.07] shadow-2xl overflow-y-auto"
        style={{ background: '#07101F', animation: 'slide-in 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <SteinzLogo size={32} />
            <div>
              <div className="text-[15px] font-black text-white">STEINZ</div>
              <div className="text-[10px] text-[#3D5270] uppercase tracking-widest">Labs</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] text-[#3D5270] hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Wallet */}
        <div className="p-4 border-b border-white/[0.06]">
          {account ? (
            <div className="bg-[#0D1A2B] rounded-2xl p-4 border border-[#1B4FFF]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF]" />
                <div>
                  <div className="text-[11px] text-[#3D5270]">Connected</div>
                  <div className="text-[13px] font-mono text-white">{formatAddress(account, 6)}</div>
                </div>
              </div>
              <button onClick={onLogout}
                className="w-full py-2.5 rounded-xl border border-[#FF3E3E]/30 text-[#FF3E3E] text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-[#FF3E3E]/10 transition-colors">
                <LogOut size={12} /> Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => { onLogin(); onClose(); }}
              className="w-full py-3.5 rounded-2xl font-bold text-[14px] text-black btn-buy flex items-center justify-center gap-2">
              Connect Wallet
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="p-3 space-y-1">
          {[
            { href: '/dashboard', label: 'Home' },
            { href: '/market', label: 'Market' },
            { href: '/context', label: 'Context Feed' },
            { href: '/portfolio', label: 'Wallet' },
            { href: '/dna-analyzer', label: 'DNA Analyzer' },
            { href: '/scanner', label: 'Token Scanner' },
            { href: '/social', label: 'Social' },
            { href: '/vtx', label: 'VTX AI' },
            { href: '/watchlists', label: 'Watchlists' },
            { href: '/alerts', label: 'Alerts' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={onClose}
              className="block px-4 py-3 rounded-xl text-[14px] text-[#6B84A8] hover:text-white hover:bg-white/[0.04] transition-all">
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-white/[0.06]">
          <Link href="/settings" onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] text-[#3D5270] hover:text-white hover:bg-white/[0.04] transition-all">
            <Settings size={14} /> Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Search Overlay ────────────────────────────────────── */
function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);
  const suggestions = [
    { label: 'Bitcoin', symbol: 'BTC', href: '/token/bitcoin' },
    { label: 'Ethereum', symbol: 'ETH', href: '/token/ethereum' },
    { label: 'Solana', symbol: 'SOL', href: '/token/solana' },
    { label: 'Market Terminal', symbol: '', href: '/market' },
    { label: 'Context Feed', symbol: '', href: '/context' },
    { label: 'Token Scanner', symbol: '', href: '/scanner' },
  ].filter(s => !query || s.label.toLowerCase().includes(query.toLowerCase()) || s.symbol.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0D1A2B] border border-white/10 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={e => e.stopPropagation()} style={{ animation: 'fadeInScale 0.18s ease-out' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
          <Search size={15} className="text-[#3D5270]" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search tokens, wallets, tools..." className="flex-1 bg-transparent text-[#EEF2FF] text-[14px] placeholder-[#3D5270] focus:outline-none" />
          <kbd className="px-2 py-0.5 text-[10px] text-[#3D5270] bg-white/5 border border-white/8 rounded" onClick={onClose}>ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {suggestions.map(s => (
            <Link key={s.href} href={s.href} onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 border-b border-white/4 last:border-0 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#1B4FFF]/15 border border-[#1B4FFF]/25 flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#7BA4FF]">{s.symbol ? s.symbol.slice(0,2) : '→'}</span>
              </div>
              <span className="text-[13px] font-semibold text-[#EEF2FF]">{s.label}</span>
            </Link>
          ))}
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
  const [showMenu, setShowMenu]     = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const authenticated = !!account;
  const walletAddress = account?.address ?? null;

  function login() { connect({ client: thirdwebClient, wallets, theme: 'dark' }); }
  function logout() { if (activeWallet) disconnect(activeWallet); setShowDropdown(false); setShowMenu(false); }

  // Close dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); }
    if (showDropdown) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showDropdown]);

  // Keyboard shortcut
  useEffect(() => {
    function h(e: KeyboardEvent) { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); } }
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const THEMES: { id: Theme; label: string; icon?: string }[] = [
    { id: 'dark',  label: 'Dark',  icon: '🌙' },
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'bingo', label: 'Bingo', icon: '✨' },
  ];

  return (
    <>
      {/* ── Main header bar ────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/[0.06] relative z-40"
        style={{ background: 'rgba(7, 16, 31, 0.98)', backdropFilter: 'blur(20px)' }}>

        {/* Top row */}
        <div className="flex items-center gap-3 px-4 h-14">
          {/* Logo (always visible on mobile, hidden on desktop when sidebar shows) */}
          <Link href="/dashboard" className="flex items-center gap-3 lg:hidden flex-shrink-0">
            <SteinzLogo size={36} />
            <span className="text-[17px] font-black text-white tracking-tight">STEINZ</span>
          </Link>

          {/* Desktop logo */}
          <Link href="/dashboard" className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <SteinzLogo size={32} />
            <span className="text-[15px] font-black text-white tracking-tight">STEINZ</span>
          </Link>

          {/* Theme switcher */}
          <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-0.5 gap-0.5 flex-shrink-0 ml-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  theme === t.id
                    ? t.id === 'bingo'
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FFD23F] text-black'
                      : t.id === 'light'
                      ? 'bg-white/90 text-[#0A1628]'
                      : 'bg-[#1B4FFF] text-white shadow-[0_0_12px_rgba(27,79,255,0.5)]'
                    : 'text-[#3D5270] hover:text-[#6B84A8]'
                }`}>
                <span className="text-[10px]">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Right: search + bell + wallet + hamburger */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <button onClick={() => setShowSearch(true)}
              className="hidden sm:flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-xl px-3 py-2 text-[11px] text-[#3D5270] hover:text-[#6B84A8] transition-all">
              <Search size={12} />
              <span>Search...</span>
              <kbd className="text-[9px] text-[#3D5270] bg-white/5 px-1 py-0.5 rounded border border-white/8">⌘K</kbd>
            </button>

            {/* Notifications */}
            <button className="relative w-9 h-9 flex items-center justify-center text-[#3D5270] hover:text-[#EEF2FF] hover:bg-white/5 rounded-xl transition-all">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF6B35] rounded-full" />
            </button>

            {/* Wallet (desktop) */}
            <div className="hidden lg:block" ref={dropdownRef}>
              {authenticated ? (
                <div className="relative">
                  <button onClick={() => setShowDropdown(p => !p)}
                    className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-[#1B4FFF]/30 rounded-xl px-3 py-2 transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF] flex-shrink-0" />
                    <span className="text-[12px] font-mono text-[#EEF2FF]">{formatAddress(walletAddress!, 4)}</span>
                    <ChevronDown size={11} className={`text-[#3D5270] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0D1A2B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      style={{ animation: 'fadeInScale 0.15s ease-out' }}>
                      <div className="p-3 border-b border-white/6">
                        <div className="text-[10px] text-[#3D5270] mb-1">Connected Wallet</div>
                        <div className="text-[12px] font-mono text-[#EEF2FF]">{formatAddress(walletAddress!, 8)}</div>
                      </div>
                      <div className="p-1">
                        {[
                          { href: '/portfolio', icon: Briefcase, label: 'My Wallet' },
                          { href: '/profile', icon: User, label: 'Profile' },
                          { href: '/settings', icon: Settings, label: 'Settings' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link key={href} href={href} onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] text-[#6B84A8] hover:text-white hover:bg-white/5 transition-all">
                            <Icon size={13} /> {label}
                          </Link>
                        ))}
                        <div className="border-t border-white/5 mt-1 pt-1">
                          <button onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] text-[#FF3E3E] hover:bg-[#FF3E3E]/8 transition-all">
                            <LogOut size={13} /> Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={login} className="btn-primary px-4 py-2 rounded-xl text-[12px] font-bold">
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Hamburger (mobile only) */}
            <button onClick={() => setShowMenu(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#6B84A8] hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* ── Price Ticker Row ──────────────────────────────── */}
        <div className="h-8 border-t border-white/[0.04] overflow-hidden flex items-center"
          style={{ background: 'rgba(5, 10, 20, 0.8)' }}>
          <div className="ticker-track">
            {/* Doubled for seamless loop */}
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 text-[11px] font-mono flex-shrink-0">
                <span className="text-[#6B84A8] font-semibold">{item.symbol}</span>
                <span className="text-[#EEF2FF]">{item.price}</span>
                <span className={`font-bold ${item.change >= 0 ? 'text-[#00D084]' : 'text-[#FF3E3E]'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </span>
                <span className="text-[#1B4FFF]/40">·</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Overlays */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
      {showMenu && (
        <HamburgerDrawer
          onClose={() => setShowMenu(false)}
          onLogin={login}
          account={walletAddress}
          onLogout={logout}
        />
      )}
    </>
  );
}
