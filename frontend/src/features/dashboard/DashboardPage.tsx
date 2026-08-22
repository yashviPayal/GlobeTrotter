import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { CityCard } from '@/features/cities/CityCard'
import { listCities } from '@/features/cities/api'
import { TripCard } from '@/features/trips/TripCard'
import { listTrips } from '@/features/trips/api'
import { STATUS_LABEL, getTripDays, getTripStatus } from '@/features/trips/tripStatus'
import { ApiError } from '@/lib/api'
import { formatMoney, sum } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/auth'
import type { Trip } from '@/types/api'

import { StatTile } from './StatTile'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function tripBudget(trip: Trip): number {
  return sum(trip.accommodation_budget, trip.transport_budget, trip.meal_budget)
}

/** Days until departure — 0 means it starts today. */
function daysUntil(trip: Trip): number {
  return differenceInCalendarDays(parseISO(trip.start_date), new Date())
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: ({ signal }) => listTrips(signal),
  })

  const citiesQuery = useQuery({
    queryKey: queryKeys.cities.all,
    queryFn: ({ signal }) => listCities(signal),
    staleTime: 5 * 60_000,
  })

  const stats = useMemo(() => {
    const trips = tripsQuery.data ?? []
    const active = trips.filter((trip) => getTripStatus(trip) !== 'completed')

    return {
      total: trips.length,
      upcoming: trips.filter((trip) => getTripStatus(trip) === 'upcoming').length,
      completed: trips.filter((trip) => getTripStatus(trip) === 'completed').length,
      // Only trips still ahead of you count towards planned spend — money
      // already spent is not a plan.
      plannedBudget: active.reduce((total, trip) => total + tripBudget(trip), 0),
      plannedDays: active.reduce((total, trip) => total + getTripDays(trip), 0),
    }
  }, [tripsQuery.data])

  // Whatever is happening soonest: an ongoing trip beats the nearest upcoming one.
  const nextTrip = useMemo(() => {
    const trips = tripsQuery.data ?? []
    const ongoing = trips
      .filter((trip) => getTripStatus(trip) === 'ongoing')
      .sort((a, b) => a.start_date.localeCompare(b.start_date))

    if (ongoing[0]) return ongoing[0]

    return (
      trips
        .filter((trip) => getTripStatus(trip) === 'upcoming')
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null
    )
  }, [tripsQuery.data])

  const recentTrips = useMemo(
    () =>
      [...(tripsQuery.data ?? [])]
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
        .filter((trip) => trip.id !== nextTrip?.id)
        .slice(0, 3),
    [tripsQuery.data, nextTrip],
  )

  const popularCities = useMemo(
    () => [...(citiesQuery.data ?? [])].sort((a, b) => b.popularity - a.popularity).slice(0, 4),
    [citiesQuery.data],
  )

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}
            {user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here is where your travel planning stands today.
          </p>
        </div>

        <Link to="/trips/new">
          <Button>Plan a trip</Button>
        </Link>
      </header>

      {tripsQuery.isPending && <LoadingState label="Loading your dashboard…" />}

      {tripsQuery.isError && (
        <ErrorState
          message={
            tripsQuery.error instanceof ApiError
              ? tripsQuery.error.message
              : 'Could not load your trips.'
          }
          onRetry={() => void tripsQuery.refetch()}
        />
      )}

      {tripsQuery.isSuccess && (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Trips planned"
              value={String(stats.total)}
              detail={stats.completed > 0 ? `${stats.completed} completed` : undefined}
            />
            <StatTile
              label="Still ahead"
              value={String(stats.upcoming)}
              detail={stats.upcoming === 1 ? 'trip upcoming' : 'trips upcoming'}
            />
            <StatTile
              label="Days on the road"
              value={String(stats.plannedDays)}
              detail="across trips not yet finished"
            />
            <StatTile
              label="Planned spend"
              value={formatMoney(stats.plannedBudget)}
              detail="stay, transport and meals"
            />
          </dl>

          {nextTrip ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Next up
              </h2>

              <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {STATUS_LABEL[getTripStatus(nextTrip)]}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold">{nextTrip.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {format(parseISO(nextTrip.start_date), 'd MMM yyyy')} ·{' '}
                    {getTripDays(nextTrip)} days · {formatMoney(tripBudget(nextTrip))}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold leading-none">
                      {getTripStatus(nextTrip) === 'ongoing'
                        ? 'Now'
                        : `${daysUntil(nextTrip)}`}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {getTripStatus(nextTrip) === 'ongoing' ? 'under way' : 'days to go'}
                    </p>
                  </div>

                  <Link to={`/trips/${nextTrip.id}`}>
                    <Button variant="secondary">View trip</Button>
                  </Link>
                </div>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="No trips planned yet"
              description="Create your first trip and this dashboard will fill up with dates, budgets and countdowns."
              action={
                <Link to="/trips/new">
                  <Button>Plan a trip</Button>
                </Link>
              }
            />
          )}

          {recentTrips.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Your other trips
                </h2>
                <Link to="/trips" className="text-sm font-medium text-primary hover:underline">
                  See all
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recentTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Popular destinations
          </h2>
          <Link to="/cities" className="text-sm font-medium text-primary hover:underline">
            Explore all
          </Link>
        </div>

        {citiesQuery.isPending && <LoadingState label="Loading destinations…" />}

        {citiesQuery.isError && (
          <ErrorState
            message="Could not load destinations."
            onRetry={() => void citiesQuery.refetch()}
          />
        )}

        {popularCities.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularCities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
