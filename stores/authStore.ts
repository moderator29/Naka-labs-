import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tier = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';

interface UserProfile {
  id: string;
  privyId: string;
  email?: string;
  username: string;
  avatar?: string;
  tier: Tier;
  nakaBalance: number;
  verified: boolean;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  updateTier: (tier: Tier, nakaBalance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null }),
      updateTier: (tier, nakaBalance) =>
        set((state) => ({
          user: state.user ? { ...state.user, tier, nakaBalance } : null,
        })),
    }),
    {
      name: 'steinz-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
