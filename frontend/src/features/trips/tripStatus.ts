import type { Trip, TripStatus } from '@/types/api'

/**
 * Status is derived, never stored — see docs/DATABASE.md. Computing it here
 * means a trip cannot sit in the wrong bucket because a background job did
 * not run.
 *
 * Dates arrive as plain YYYY-MM-DD, so they are compared as calendar days in
 * the user's timezone rather than as instants.
 */
function toDay(value: string): number {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getTime()
}

function today(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

export function getTripStatus(trip: Trip): TripStatus {
  const now = today()

  if (toDay(trip.end_date) < now) return 'completed'
  if (toDay(trip.start_date) > now) return 'upcoming'
  return 'ongoing'
}

export const STATUS_ORDER: TripStatus[] = ['ongoing', 'upcoming', 'completed']

export const STATUS_LABEL: Record<TripStatus, string> = {
  ongoing: 'Ongoing',
  upcoming: 'Upcoming',
  completed: 'Completed',
}

export const STATUS_TONE: Record<TripStatus, string> = {
  ongoing: 'bg-primary-tint text-primary',
  upcoming: 'bg-accent-tint text-accent',
  completed: 'bg-canvas text-muted',
}

/** Whole days from start to end, inclusive — a same-day trip is 1 day. */
export function getTripDays(trip: Trip): number {
  const span = toDay(trip.end_date) - toDay(trip.start_date)
  return Math.round(span / 86_400_000) + 1
}

export function groupByStatus(trips: Trip[]): Record<TripStatus, Trip[]> {
  const groups: Record<TripStatus, Trip[]> = { ongoing: [], upcoming: [], completed: [] }

  for (const trip of trips) {
    groups[getTripStatus(trip)].push(trip)
  }

  return groups
}
