import { create } from 'zustand';

export interface PortfolioHolding {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  balance: number;
  priceUSD: number;
  valueUSD: number;
  change24h: number;
  costBasis?: number;
  unrealizedPL?: number;
  chain: string;
}

interface PortfolioState {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalChange24h: number;
  unrealizedPL: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  setHoldings: (holdings: PortfolioHolding[]) => void;
  setLoading: (loading: boolean) => void;
  updateTotals: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  totalValue: 0,
  totalChange24h: 0,
  unrealizedPL: 0,
  isLoading: false,
  lastUpdated: null,
  setHoldings: (holdings) => {
    const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);
    const unrealizedPL = holdings.reduce((sum, h) => sum + (h.unrealizedPL ?? 0), 0);
    set({ holdings, totalValue, unrealizedPL, lastUpdated: new Date() });
  },
  setLoading: (isLoading) => set({ isLoading }),
  updateTotals: () => {
    const { holdings } = get();
    const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);
    set({ totalValue });
  },
}));
