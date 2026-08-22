import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'

import { Card } from '@/components/ui/Card'
import { DataToolbar } from '@/components/ui/DataToolbar'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { StatTile } from '@/features/dashboard/StatTile'
import { ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/money'

import { getAdminOverview, listAdminTrips, listAdminUsers } from './api'

/**
 * Screen 13 — platform analytics.
 *
 * Every figure is a live aggregate from the API, not a placeholder. The route
 * is reachable only for an admin account; the API enforces that too, so a
 * hand-typed URL gets a 403 rather than data.
 */

type Tab = 'users' | 'trips'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: ({ signal }) => getAdminOverview(signal),
  })

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: ({ signal }) => listAdminUsers(signal),
    enabled: tab === 'users',
  })

  const tripsQuery = useQuery({
    queryKey: ['admin', 'trips'],
    queryFn: ({ signal }) => listAdminTrips(signal),
    enabled: tab === 'trips',
  })

  const term = search.trim().toLowerCase()

  const users = useMemo(
    () =>
      (usersQuery.data ?? []).filter(
        (user) =>
          term === '' ||
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      ),
    [usersQuery.data, term],
  )

  const trips = useMemo(
    () =>
      (tripsQuery.data ?? []).filter(
        (trip) =>
          term === '' ||
          trip.name.toLowerCase().includes(term) ||
          trip.user_name.toLowerCase().includes(term),
      ),
    [tripsQuery.data, term],
  )

  const forbidden =
    overviewQuery.error instanceof ApiError && overviewQuery.error.status === 403

  if (forbidden) {
    return (
      <ErrorState
        title="Admins only"
        message="This account does not have access to platform analytics."
      />
    )
  }

  const overview = overviewQuery.data
  const active = tab === 'users' ? usersQuery : tripsQuery
  const rows = tab === 'users' ? users.length : trips.length

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Platform usage across every account, straight from the database.
        </p>
      </header>

      {overviewQuery.isPending && <LoadingState label="Loading platform stats…" />}

      {overviewQuery.isError && !forbidden && (
        <ErrorState
          message="Could not load platform stats."
          onRetry={() => void overviewQuery.refetch()}
        />
      )}

      {overview && (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Users" value={String(overview.total_users)} />
            <StatTile
              label="Trips"
              value={String(overview.total_trips)}
              detail={`${overview.total_public_trips} shared publicly`}
            />
            <StatTile
              label="Activities scheduled"
              value={String(overview.total_trip_activities)}
              detail={`from ${overview.total_activities} in the catalogue`}
            />
            <StatTile
              label="Activity spend"
              value={formatMoney(overview.total_activity_spend)}
              detail="planned across all trips"
            />
          </dl>

          <p className="text-sm text-muted">
            Catalogue covers {overview.total_cities} cities and{' '}
            {overview.total_activities} activities.
          </p>
        </>
      )}

      <div className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Admin records"
          className="flex gap-1 border-b border-hairline"
        >
          {(['users', 'trips'] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <DataToolbar
          search={{
            value: search,
            placeholder: tab === 'users' ? 'Search name or email…' : 'Search trip or owner…',
            onChange: setSearch,
          }}
          meta={active.isSuccess ? `${rows} ${rows === 1 ? 'record' : 'records'}` : undefined}
        />

        {active.isPending && <LoadingState label={`Loading ${tab}…`} />}

        {active.isError && (
          <ErrorState message={`Could not load ${tab}.`} onRetry={() => void active.refetch()} />
        )}

        {active.isSuccess && rows === 0 && (
          <EmptyState title="Nothing matches" description="Try a different search term." />
        )}

        {rows > 0 && (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-hairline text-xs uppercase tracking-wide text-muted">
                {tab === 'users' ? (
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 font-medium">Trip</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Dates</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {tab === 'users'
                  ? users.map((user) => (
                      <tr key={user.id} className="border-b border-hairline last:border-0">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted">{user.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-accent-tint text-accent'
                                : 'bg-primary-tint text-primary'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {format(parseISO(user.created_at), 'd MMM yyyy')}
                        </td>
                      </tr>
                    ))
                  : trips.map((trip) => (
                      <tr key={trip.id} className="border-b border-hairline last:border-0">
                        <td className="px-4 py-3 font-medium">{trip.name}</td>
                        <td className="px-4 py-3 text-muted">{trip.user_name}</td>
                        <td className="px-4 py-3 text-muted">
                          {format(parseISO(trip.start_date), 'd MMM')} –{' '}
                          {format(parseISO(trip.end_date), 'd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              trip.is_public
                                ? 'bg-primary-tint text-primary'
                                : 'bg-canvas text-muted'
                            }`}
                          >
                            {trip.is_public ? 'Public' : 'Private'}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </section>
  )
}
