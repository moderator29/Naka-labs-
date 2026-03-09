import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

const PrivyProvider = dynamic(() => import('@/components/auth/PrivyProvider'), { ssr: false });

export const metadata: Metadata = {
  title: 'Steinz Labs - Web3 Intelligence Platform',
  description: 'Next-generation Web3 intelligence: AI-powered trading, whale tracking, wallet DNA analysis, and token security scanning.',
  keywords: ['DeFi', 'Web3', 'crypto trading', 'whale tracker', 'token scanner', 'blockchain analytics'],
  openGraph: {
    title: 'Steinz Labs',
    description: 'Web3 Intelligence Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-white antialiased">
        <PrivyProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#252D3F',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#00E5FF', secondary: '#0A0E1A' },
              },
              error: {
                iconTheme: { primary: '#FF6B35', secondary: '#0A0E1A' },
              },
            }}
          />
        </PrivyProvider>
      </body>
    </html>
  );
}
