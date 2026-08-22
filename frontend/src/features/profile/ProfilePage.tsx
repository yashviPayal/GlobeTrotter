import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatTile } from '@/features/dashboard/StatTile'
import { listTrips } from '@/features/trips/api'
import { getTripDays, getTripStatus } from '@/features/trips/tripStatus'
import { formatMoney, sum } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/auth'

/**
 * Account details and travel stats.
 *
 * Read-only for now: the API exposes no /me endpoint, so there is nothing to
 * PATCH against. Everything shown is derived from the session and the user's
 * own trips rather than invented.
 */
export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: ({ signal }) => listTrips(signal),
  })

  const stats = useMemo(() => {
    const trips = data ?? []
    const active = trips.filter((trip) => getTripStatus(trip) !== 'completed')

    return {
      total: trips.length,
      completed: trips.filter((trip) => getTripStatus(trip) === 'completed').length,
      days: active.reduce((total, trip) => total + getTripDays(trip), 0),
      spend: active.reduce(
        (total, trip) =>
          total + sum(trip.accommodation_budget, trip.transport_budget, trip.meal_budget),
        0,
      ),
    }
  }, [data])

  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account and how much travel you have planned.</p>
      </header>

      <Card className="flex flex-wrap items-center gap-4 p-6">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-on-primary"
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold">{user?.name}</p>
          <p className="mt-0.5 text-sm text-muted">{user?.email}</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Log out
        </Button>
      </Card>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Trips planned"
          value={String(stats.total)}
          detail={stats.completed > 0 ? `${stats.completed} completed` : undefined}
        />
        <StatTile label="Days on the road" value={String(stats.days)} detail="still ahead" />
        <StatTile label="Planned spend" value={formatMoney(stats.spend)} detail="across open trips" />
        <StatTile
          label="Completed"
          value={String(stats.completed)}
          detail={stats.completed === 1 ? 'trip finished' : 'trips finished'}
        />
      </dl>

      <Card className="p-6">
        <h2 className="font-medium">Editing your details</h2>
        <p className="mt-1 text-sm text-muted">
          Changing your name, email or photo needs a profile endpoint on the API, which does not
          exist yet. Once it lands this page becomes editable.
        </p>
      </Card>
    </section>
  )
}
