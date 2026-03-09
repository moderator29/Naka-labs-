'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Zap,
  Briefcase,
  Dna,
  Shield,
  TrendingUp,
  Users,
  Bot,
  Bell,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

/* ── Navigation groups ─────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
      { href: '/market', icon: TrendingUp, label: 'Market', badge: 'LIVE' },
      { href: '/context', icon: Zap, label: 'Context Feed', badge: 'NEW' },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { href: '/portfolio', icon: Briefcase, label: 'Wallet' },
      { href: '/watchlists', icon: Star, label: 'Watchlists' },
      { href: '/alerts', icon: Bell, label: 'Alerts' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/dna-analyzer', icon: Dna, label: 'DNA Analyzer' },
      { href: '/scanner', icon: Shield, label: 'Token Scanner' },
      { href: '/social', icon: Users, label: 'Social' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/vtx', icon: Bot, label: 'VTX AI' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const BADGE_STYLES: Record<string, string> = {
  LIVE: 'bg-[#00D084]/15 text-[#00D084] border border-[#00D084]/30',
  NEW:  'bg-[#1B4FFF]/15 text-[#7BA4FF] border border-[#1B4FFF]/30',
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  }

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen border-r border-white/[0.06] transition-all duration-300 ease-in-out flex-shrink-0',
        'hidden lg:flex',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
      style={{ background: 'rgba(7, 16, 31, 0.98)' }}
    >
      {/* ── Logo ───────────────────────────────────────── */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] flex-shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B4FFF] to-[#00C6FF] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(27,79,255,0.5)]">
          <span className="text-white text-[10px] font-black tracking-tight">SL</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-[#EEF2FF] font-bold text-[15px] tracking-tight leading-tight">
              Steinz<span className="text-[#1B4FFF]">.</span>
            </div>
            <div className="text-[9px] text-[#3D5270] uppercase tracking-widest font-semibold">Labs</div>
          </div>
        )}
      </div>

      {/* ── Live indicator ─────────────────────────────── */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse" />
          <span className="text-[10px] text-[#3D5270] font-medium">All systems operational</span>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-1">
            {/* Group label */}
            {!collapsed && (
              <div className="px-4 py-2 text-[10px] font-bold text-[#1B4FFF] uppercase tracking-[0.12em]">
                {group.label}
              </div>
            )}
            {collapsed && <div className="h-px bg-white/[0.04] mx-3 my-2" />}

            {/* Items */}
            <div className="space-y-0.5 px-2">
              {group.items.map(({ href, icon: Icon, label, badge }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                      collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                      active
                        ? 'bg-[#1B4FFF]/15 text-white border border-[#1B4FFF]/30'
                        : 'text-[#3D5270] hover:bg-white/[0.04] hover:text-[#6B84A8] border border-transparent'
                    )}
                  >
                    {/* Active indicator */}
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1B4FFF] rounded-full shadow-[0_0_8px_rgba(27,79,255,0.8)]" />
                    )}

                    <Icon
                      size={16}
                      className={clsx(
                        'flex-shrink-0 transition-colors',
                        active ? 'text-[#1B4FFF]' : 'text-inherit'
                      )}
                    />

                    {!collapsed && (
                      <>
                        <span className="text-[13px] font-medium flex-1">{label}</span>
                        {badge && (
                          <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-md', BADGE_STYLES[badge] ?? '')}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0D1A2B] text-[#EEF2FF] text-[12px] font-medium rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 border border-white/10 shadow-xl">
                        {label}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#0D1A2B] border-l border-t border-white/10 rotate-[-45deg]" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Platform stats ─────────────────────────────── */}
      {!collapsed && (
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          {/* Tier badge */}
          <div className="bg-[#1B4FFF]/8 border border-[#1B4FFF]/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#3D5270] font-semibold uppercase tracking-wider">Current Tier</span>
              <Link href="/settings" className="text-[10px] text-[#1B4FFF] hover:text-[#7BA4FF] transition-colors font-semibold">
                Upgrade →
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#6B84A8]" />
              <span className="text-[13px] font-bold text-[#EEF2FF]">FREE</span>
            </div>
            {/* Tier progress */}
            <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full w-[5%] bg-gradient-to-r from-[#1B4FFF] to-[#00C6FF] rounded-full" />
            </div>
            <div className="mt-1 text-[10px] text-[#3D5270]">0 / 500K NAKA for Bronze</div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[10px] text-[#3D5270]">
            <div className="flex items-center gap-1">
              <Activity size={10} className="text-[#00D084]" />
              <span>Live feed</span>
            </div>
            <div className="w-px h-3 bg-white/8" />
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B4FFF]" />
              <span>11 chains</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ─────────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#0D1A2B] border border-white/10 rounded-full flex items-center justify-center text-[#3D5270] hover:text-white hover:border-[#1B4FFF]/50 transition-all z-10 shadow-lg"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
