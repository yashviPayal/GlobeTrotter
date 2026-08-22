/**
 * Every cache key in one place, so an invalidation can never miss a consumer
 * because two files spelled the same key differently.
 */
export const queryKeys = {
  trips: {
    all: ['trips'] as const,
    detail: (id: number) => ['trips', id] as const,
  },
  cities: {
    all: ['cities'] as const,
    search: (query: string) => ['cities', 'search', query] as const,
    detail: (id: number) => ['cities', id] as const,
    activities: (id: number) => ['cities', id, 'activities'] as const,
  },
} as const
