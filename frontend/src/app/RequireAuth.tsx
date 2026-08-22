import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useIsAuthenticated } from '@/store/auth'

/**
 * One guard for every private route, so no screen has to remember to check.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
