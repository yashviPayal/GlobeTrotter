import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { DataToolbar } from '@/components/ui/DataToolbar'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { City } from '@/types/api'

import { CityCard } from './CityCard'
import { listCities, listCountries, searchCities } from './api'

type SortKey = 'popularity' | 'name' | 'cost-asc' | 'cost-desc'

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most popular' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'cost-asc', label: 'Cheapest first' },
  { value: 'cost-desc', label: 'Most expensive' },
]

function sortCities(cities: City[], sort: SortKey): City[] {
  const sorted = [...cities]

  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'cost-asc':
      return sorted.sort((a, b) => a.cost_index - b.cost_index)
    case 'cost-desc':
      return sorted.sort((a, b) => b.cost_index - a.cost_index)
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity)
  }
}

export function CitiesPage() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [sort, setSort] = useState<SortKey>('popularity')

  const debouncedSearch = useDebouncedValue(search.trim())
  // The search endpoint requires two characters, so short queries fall back
  // to the full list rather than firing a request the API would reject.
  const useSearchEndpoint = debouncedSearch.length >= 2

  const citiesQuery = useQuery({
    queryKey: useSearchEndpoint
      ? queryKeys.cities.search(debouncedSearch)
      : queryKeys.cities.all,
    queryFn: ({ signal }) =>
      useSearchEndpoint ? searchCities(debouncedSearch, signal) : listCities(signal),
  })

  const countriesQuery = useQuery({
    queryKey: ['countries'],
    queryFn: ({ signal }) => listCountries(signal),
    staleTime: 5 * 60_000,
  })

  const visible = useMemo(() => {
    const cities = citiesQuery.data ?? []
    const filtered =
      country === 'all'
        ? cities
        : cities.filter((city) => String(city.country_id) === country)

    return sortCities(filtered, sort)
  }, [citiesQuery.data, country, sort])

  const countryOptions = useMemo(
    () => [
      { value: 'all', label: 'All countries' },
      ...(countriesQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [countriesQuery.data],
  )

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Explore cities</h1>
        <p className="mt-1 text-sm text-muted">
          Find a destination by name, country or how expensive it is day to day.
        </p>
      </header>

      <DataToolbar
        search={{
          value: search,
          placeholder: 'Search cities…',
          onChange: setSearch,
        }}
        filters={[
          {
            label: 'Country',
            value: country,
            options: countryOptions,
            onChange: setCountry,
          },
        ]}
        sort={{
          label: 'Sort by',
          value: sort,
          options: SORT_OPTIONS,
          onChange: (value) => setSort(value as SortKey),
        }}
        meta={
          citiesQuery.isSuccess
            ? `${visible.length} ${visible.length === 1 ? 'city' : 'cities'}`
            : undefined
        }
      />

      {citiesQuery.isPending && <LoadingState label="Loading cities…" />}

      {citiesQuery.isError && (
        <ErrorState
          message={
            citiesQuery.error instanceof ApiError
              ? citiesQuery.error.message
              : 'Could not load cities.'
          }
          onRetry={() => void citiesQuery.refetch()}
        />
      )}

      {citiesQuery.isSuccess && visible.length === 0 && (
        <EmptyState
          title="No cities match"
          description="Try a different search term, or clear the country filter."
        />
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}
    </section>
  )
}
