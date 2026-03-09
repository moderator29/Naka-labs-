// Treasury Wallets - NEVER CHANGE
export const TREASURY_WALLET_EVM = '0xe06f884A4C545BE4FAb920239f2321b71bC7cE1b';
export const TREASURY_WALLET_SOLANA = '9VjPx71cXSp91nYTtpxbL4YnKT8m1GGG5pxMvK2Ya9tR';

// Trading fees
export const TRADING_FEE_FREE = 0.005;   // 0.5%
export const TRADING_FEE_PAID = 0.004;   // 0.4%

// Tier NAKA requirements
export const TIER_REQUIREMENTS = {
  FREE: 0,
  BRONZE: 500_000,
  SILVER: 1_000_000,
  GOLD: 2_000_000,
};

// Supported chains
export const CHAINS = [
  { id: 'ETHEREUM', name: 'Ethereum', symbol: 'ETH', chainId: 1, color: '#627EEA', icon: '⟠' },
  { id: 'SOLANA', name: 'Solana', symbol: 'SOL', chainId: 0, color: '#9945FF', icon: '◎' },
  { id: 'BASE', name: 'Base', symbol: 'ETH', chainId: 8453, color: '#0052FF', icon: '🔵' },
  { id: 'ARBITRUM', name: 'Arbitrum', symbol: 'ETH', chainId: 42161, color: '#28A0F0', icon: '🔷' },
  { id: 'POLYGON', name: 'Polygon', symbol: 'MATIC', chainId: 137, color: '#8247E5', icon: '⬡' },
  { id: 'BSC', name: 'BSC', symbol: 'BNB', chainId: 56, color: '#F3BA2F', icon: '🟡' },
  { id: 'AVALANCHE', name: 'Avalanche', symbol: 'AVAX', chainId: 43114, color: '#E84142', icon: '🔺' },
  { id: 'OPTIMISM', name: 'Optimism', symbol: 'ETH', chainId: 10, color: '#FF0420', icon: '🔴' },
  { id: 'BLAST', name: 'Blast', symbol: 'ETH', chainId: 81457, color: '#FCFC03', icon: '💥' },
  { id: 'ZKSYNC', name: 'ZKsync', symbol: 'ETH', chainId: 324, color: '#8C8DFC', icon: '⚡' },
  { id: 'SCROLL', name: 'Scroll', symbol: 'ETH', chainId: 534352, color: '#FFDBB3', icon: '📜' },
] as const;

export type ChainId = (typeof CHAINS)[number]['id'];

// Alchemy RPC endpoints
export const ALCHEMY_RPCS: Record<string, string> = {
  ETHEREUM: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  BASE: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  ARBITRUM: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  POLYGON: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  OPTIMISM: `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  ZKSYNC: `https://zksync-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
};

// Signal type colors
export const SIGNAL_TYPE_COLORS: Record<string, string> = {
  BUY: '#00E5FF',
  SELL: '#FF6B35',
  WHALE_MOVEMENT: '#FFD23F',
  DEV_ACTIVITY: '#8C8DFC',
  LIQUIDITY_ADD: '#00E5FF',
  NEW_POOL: '#0A1EFF',
  UNUSUAL_VOLUME: '#FFD23F',
  SMART_MONEY: '#00E5FF',
  RUG_PULL_WARNING: '#FF0420',
};

// Risk level colors
export const RISK_COLORS: Record<string, string> = {
  LOW: '#00E5FF',
  MEDIUM: '#FFD23F',
  HIGH: '#FF6B35',
  CRITICAL: '#FF0420',
};
