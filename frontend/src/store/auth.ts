import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types/api'

/**
 * Session state only.
 *
 * Anything that came from the API lives in TanStack Query, not here — this
 * store holds the token and the signed-in user and nothing else.
 */
interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'globetrotter-auth' },
  ),
)

export const useIsAuthenticated = () => useAuthStore((state) => state.token !== null)
