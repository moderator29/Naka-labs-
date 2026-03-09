'use client';

import dynamic from 'next/dynamic';

const PrivyProvider = dynamic(() => import('./PrivyProvider'), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <PrivyProvider>{children}</PrivyProvider>;
}
