import { create } from 'zustand';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  chain: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  pairAddress?: string;
  chainId?: string;
}

interface TradingState {
  selectedToken: TokenInfo | null;
  limitPrice: number | null;
  tradeHistory: TradeRecord[];
  setSelectedToken: (token: TokenInfo | null) => void;
  setLimitPrice: (price: number | null) => void;
  addTradeRecord: (trade: TradeRecord) => void;
}

export interface TradeRecord {
  id: string;
  type: 'BUY' | 'SELL';
  tokenSymbol: string;
  amount: number;
  priceUSD: number;
  txHash: string;
  timestamp: Date;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedToken: null,
  limitPrice: null,
  tradeHistory: [],
  setSelectedToken: (token) => set({ selectedToken: token }),
  setLimitPrice: (price) => set({ limitPrice: price }),
  addTradeRecord: (trade) =>
    set((state) => ({
      tradeHistory: [trade, ...state.tradeHistory].slice(0, 100),
    })),
}));
