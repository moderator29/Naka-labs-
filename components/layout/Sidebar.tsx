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
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { href: '/market', icon: TrendingUp, label: 'Market', badge: 'LIVE' },
  { href: '/context', icon: Zap, label: 'Context Feed', badge: 'NEW' },
  { href: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { href: '/dna-analyzer', icon: Dna, label: 'DNA Analyzer' },
  { href: '/scanner', icon: Shield, label: 'Scanner' },
  { href: '/social', icon: Users, label: 'Social' },
  { href: '/vtx', icon: Bot, label: 'VTX AI' },
  { href: '/watchlists', icon: Star, label: 'Watchlists' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen bg-bg-secondary border-r border-border-default transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 p-4 border-b border-border-default', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-neon-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          SL
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">Steinz Labs</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                active
                  ? 'bg-neon-blue/20 text-white border border-neon-blue/40'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
              )}
            >
              <Icon
                size={18}
                className={clsx('flex-shrink-0', active ? 'text-neon-blue' : 'text-text-tertiary group-hover:text-white')}
              />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium">{label}</span>
                  {badge && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-neon-blue/20 text-neon-blue border border-neon-blue/30">
                      {badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-bg-elevated text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-border-default">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-bg-elevated border border-border-default rounded-full flex items-center justify-center text-text-tertiary hover:text-white hover:border-neon-blue transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Bottom - Tier Badge */}
      {!collapsed && (
        <div className="p-4 border-t border-border-default">
          <div className="bg-bg-tertiary rounded-lg p-3">
            <div className="text-xs text-text-tertiary mb-1">Current Tier</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">FREE</span>
              <Link href="/settings" className="text-xs text-neon-blue hover:underline">
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
