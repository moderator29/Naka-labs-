'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Compass, Wallet, User } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/social', icon: Users, label: 'Social' },
  { href: '/vtx', icon: null, label: 'VTX AI' },
  { href: '/scanner', icon: Compass, label: 'Discover' },
  { href: '/portfolio', icon: Wallet, label: 'Wallet' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-pb"
      style={{ background: 'rgba(7, 16, 31, 0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <div className="flex items-stretch">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const isVTX = label === 'VTX AI';

          if (isVTX) {
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center py-2 relative"
              >
                {/* VTX AI special button */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  active
                    ? 'bg-[#1B4FFF] shadow-[0_0_24px_rgba(27,79,255,0.6)]'
                    : 'bg-gradient-to-br from-[#1B4FFF] to-[#0F3AE0] shadow-[0_0_16px_rgba(27,79,255,0.35)]'
                }`}>
                  <span className="text-[9px] font-black text-white tracking-widest">VTX</span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors ${
                active ? 'text-[#1B4FFF]' : 'text-[#3D5270] hover:text-[#6B84A8]'
              }`}
            >
              {/* Active indicator dot */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1B4FFF] rounded-full shadow-[0_0_8px_rgba(27,79,255,0.8)]" />
              )}
              {Icon && (
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'drop-shadow-[0_0_6px_rgba(27,79,255,0.8)]' : ''}
                />
              )}
              <span className={`text-[10px] font-semibold ${active ? 'text-[#1B4FFF]' : 'text-[#3D5270]'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
