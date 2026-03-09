'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <Privy
      appId={appId}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#0A1EFF',
          logo: '/logo.png',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: 1,
          name: 'Ethereum',
          network: 'homestead',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: [`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`] },
            public: { http: ['https://cloudflare-eth.com'] },
          },
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            network: 'homestead',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://cloudflare-eth.com'] }, public: { http: ['https://cloudflare-eth.com'] } },
          },
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://mainnet.base.org'] }, public: { http: ['https://mainnet.base.org'] } },
          },
          {
            id: 42161,
            name: 'Arbitrum One',
            network: 'arbitrum',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] }, public: { http: ['https://arb1.arbitrum.io/rpc'] } },
          },
        ],
      }}
    >
      {children}
    </Privy>
  );
}
