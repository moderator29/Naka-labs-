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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#080812]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-pb">
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${active ? 'bg-[#0066ff] shadow-[#0066ff]/40' : 'bg-gradient-to-br from-[#0066ff]/80 to-[#0044cc]/80 shadow-[#0066ff]/20'}`}>
                  <span className="text-[9px] font-black text-white tracking-widest">VTX</span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${active ? 'text-[#0066ff]' : 'text-[#4a5568] hover:text-[#8892a4]'}`}
            >
              {Icon && <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />}
              <span className={`text-[10px] font-medium ${active ? 'text-[#0066ff]' : 'text-[#4a5568]'}`}>{label}</span>
              {active && <div className="absolute bottom-0 w-5 h-0.5 bg-[#0066ff] rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
