import clsx from 'clsx'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

/**
 * The single layout every authenticated screen renders inside: top bar plus a
 * left rail on desktop, collapsing to a bottom tab bar on mobile. Navigation
 * is learned once and never re-learned.
 */

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/trips', label: 'My Trips', end: false },
  { to: '/cities', label: 'Explore', end: false },
  { to: '/profile', label: 'Profile', end: false },
]

function navClass({ isActive }: { isActive: boolean }) {
  return clsx(
    'flex items-center rounded-control px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-tint text-primary' : 'text-muted hover:bg-primary-tint hover:text-ink',
  )
}

export function AppShell() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="font-display text-lg font-bold text-ink">
            Globe<span className="text-primary">Trotter</span>
          </NavLink>

          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-muted sm:inline">{user.name}</span>}
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <nav aria-label="Main" className="hidden w-48 shrink-0 flex-col gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-hairline bg-surface md:hidden"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex-1 py-3 text-center text-xs font-medium',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
