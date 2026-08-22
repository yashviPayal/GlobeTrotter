import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Card } from '@/components/ui/Card'
import { DataToolbar } from '@/components/ui/DataToolbar'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { ApiError } from '@/lib/api'
import { formatMoney, toNumber } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import type { Activity } from '@/types/api'

import { CityImage } from './CityImage'
import { getCity, getCityActivities } from './api'
import { costLabel } from './costIndex'

type SortKey = 'name' | 'cost-asc' | 'cost-desc' | 'duration'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'cost-asc', label: 'Cheapest first' },
  { value: 'cost-desc', label: 'Most expensive' },
  { value: 'duration', label: 'Shortest first' },
]

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return hours === 1 ? '1 hour' : `${Number(hours.toFixed(1))} hours`
}

function sortActivities(activities: Activity[], sort: SortKey): Activity[] {
  const sorted = [...activities]

  switch (sort) {
    case 'cost-asc':
      return sorted.sort((a, b) => toNumber(a.estimated_cost) - toNumber(b.estimated_cost))
    case 'cost-desc':
      return sorted.sort((a, b) => toNumber(b.estimated_cost) - toNumber(a.estimated_cost))
    case 'duration':
      return sorted.sort((a, b) => a.duration_hours - b.duration_hours)
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
}

export function CityDetailPage() {
  const { cityId } = useParams()
  const id = Number(cityId)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<SortKey>('name')

  const cityQuery = useQuery({
    queryKey: queryKeys.cities.detail(id),
    queryFn: ({ signal }) => getCity(id, signal),
    enabled: Number.isFinite(id),
  })

  const activitiesQuery = useQuery({
    queryKey: queryKeys.cities.activities(id),
    queryFn: ({ signal }) => getCityActivities(id, signal),
    enabled: Number.isFinite(id),
  })

  const categoryOptions = useMemo(() => {
    const categories = [...new Set((activitiesQuery.data ?? []).map((a) => a.category))].sort()
    return [
      { value: 'all', label: 'All categories' },
      ...categories.map((name) => ({ value: name, label: name })),
    ]
  }, [activitiesQuery.data])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()

    const filtered = (activitiesQuery.data ?? []).filter((activity) => {
      const matchesCategory = category === 'all' || activity.category === category
      const matchesSearch =
        term === '' ||
        activity.name.toLowerCase().includes(term) ||
        (activity.description ?? '').toLowerCase().includes(term)

      return matchesCategory && matchesSearch
    })

    return sortActivities(filtered, sort)
  }, [activitiesQuery.data, category, search, sort])

  if (cityQuery.isPending) return <LoadingState label="Loading city…" />

  if (cityQuery.isError) {
    return (
      <ErrorState
        message={
          cityQuery.error instanceof ApiError ? cityQuery.error.message : 'Could not load city.'
        }
        onRetry={() => void cityQuery.refetch()}
      />
    )
  }

  const city = cityQuery.data
  const cost = costLabel(city.cost_index)

  return (
    <section className="flex flex-col gap-6">
      <nav className="text-sm text-muted">
        <Link to="/cities" className="hover:text-primary">
          Explore
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{city.name}</span>
      </nav>

      <Card className="overflow-hidden">
        <CityImage
          name={city.name}
          url={city.image_url}
          width={1400}
          priority
          className="h-48 w-full sm:h-60"
        />

        <div className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{city.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {city.country.name}
              {city.region && ` · ${city.region}`}
            </p>
          </div>

          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-xs text-muted">Daily cost</dt>
              <dd className={`mt-0.5 font-medium ${cost.tone}`}>{cost.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Popularity</dt>
              <dd className="mt-0.5 font-medium">{city.popularity}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Things to do</h2>

        <DataToolbar
          search={{
            value: search,
            placeholder: 'Search activities…',
            onChange: setSearch,
          }}
          filters={[
            {
              label: 'Category',
              value: category,
              options: categoryOptions,
              onChange: setCategory,
            },
          ]}
          sort={{
            label: 'Sort by',
            value: sort,
            options: SORT_OPTIONS,
            onChange: (value) => setSort(value as SortKey),
          }}
          meta={
            activitiesQuery.isSuccess
              ? `${visible.length} ${visible.length === 1 ? 'activity' : 'activities'}`
              : undefined
          }
        />

        {activitiesQuery.isPending && <LoadingState label="Loading activities…" />}

        {activitiesQuery.isError && (
          <ErrorState
            message="Could not load activities for this city."
            onRetry={() => void activitiesQuery.refetch()}
          />
        )}

        {activitiesQuery.isSuccess && visible.length === 0 && (
          <EmptyState
            title="Nothing matches"
            description="Try a different search term or category."
          />
        )}

        {visible.length > 0 && (
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map((activity) => (
              <li key={activity.id}>
                <Card className="flex h-full flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium leading-tight">{activity.name}</h3>
                    <span className="shrink-0 rounded-full bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">
                      {activity.category}
                    </span>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-muted">{activity.description}</p>
                  )}

                  <p className="mt-auto flex gap-4 border-t border-hairline pt-2 text-sm">
                    <span className="font-medium">
                      {toNumber(activity.estimated_cost) === 0
                        ? 'Free'
                        : formatMoney(activity.estimated_cost)}
                    </span>
                    <span className="text-muted">{formatDuration(activity.duration_hours)}</span>
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
