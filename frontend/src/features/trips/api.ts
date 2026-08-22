import { api } from '@/lib/api'
import type {
  Budget,
  PublicTrip,
  StopCreate,
  Trip,
  TripActivity,
  TripActivityCreate,
  TripCreate,
  TripStop,
  TripUpdate,
} from '@/types/api'


/* -------------------------------------------------------------------------- */
/* Trips                                                                      */
/* -------------------------------------------------------------------------- */

export function listTrips(signal?: AbortSignal) {
  return api.get<Trip[]>(
    '/trips/',
    signal,
  )
}

export function getTrip(
  id: number,
  signal?: AbortSignal,
) {
  return api.get<Trip>(
    `/trips/${id}`,
    signal,
  )
}

export function createTrip(
  payload: TripCreate,
) {
  return api.post<Trip>(
    '/trips/',
    payload,
  )
}

export function updateTrip(
  id: number,
  payload: TripUpdate,
) {
  return api.put<Trip>(
    `/trips/${id}`,
    payload,
  )
}

export function deleteTrip(
  id: number,
) {
  return api.delete<void>(
    `/trips/${id}`,
  )
}


/* -------------------------------------------------------------------------- */
/* Stops                                                                      */
/* -------------------------------------------------------------------------- */

export function listStops(
  tripId: number,
  signal?: AbortSignal,
) {
  return api.get<TripStop[]>(
    `/trips/${tripId}/stops/`,
    signal,
  )
}

export function listTripStops(
  tripId: number,
  signal?: AbortSignal,
) {
  return listStops(
    tripId,
    signal,
  )
}

export function createStop(
  tripId: number,
  payload: StopCreate,
) {
  return api.post<TripStop>(
    `/trips/${tripId}/stops/`,
    payload,
  )
}

export function createTripStop(
  tripId: number,
  payload: {
    city_id: number
    start_date: string
    end_date: string
  },
) {
  return createStop(
    tripId,
    payload,
  )
}

export function updateTripStop(
  tripId: number,
  stopId: number,
  payload: {
    city_id?: number
    start_date?: string
    end_date?: string
  },
) {
  return api.put<TripStop>(
    `/trips/${tripId}/stops/${stopId}`,
    payload,
  )
}

export function deleteStop(
  tripId: number,
  stopId: number,
) {
  return api.delete<void>(
    `/trips/${tripId}/stops/${stopId}`,
  )
}

export function deleteTripStop(
  tripId: number,
  stopId: number,
) {
  return deleteStop(
    tripId,
    stopId,
  )
}

export function reorderTripStops(
  tripId: number,
  stopIds: number[],
) {
  return api.patch<TripStop[]>(
    `/trips/${tripId}/stops/reorder`,
    {
      stop_ids: stopIds,
    },
  )
}

export function restoreAutomaticStopOrder(
  tripId: number,
) {
  return api.patch<TripStop[]>(
    `/trips/${tripId}/stops/reorder/automatic`,
  )
}


/* -------------------------------------------------------------------------- */
/* Trip Activities                                                            */
/* -------------------------------------------------------------------------- */

export function listTripActivities(
  tripId: number,
  signal?: AbortSignal,
) {
  return api.get<TripActivity[]>(
    `/trips/${tripId}/activities/`,
    signal,
  )
}

export function createTripActivity(
  tripId: number,
  payload: TripActivityCreate,
) {
  return api.post<TripActivity>(
    `/trips/${tripId}/activities/`,
    payload,
  )
}

export function deleteTripActivity(
  tripId: number,
  tripActivityId: number,
) {
  return api.delete<void>(
    `/trips/${tripId}/activities/${tripActivityId}`,
  )
}

export function updateTripActivity(
  tripId: number,
  activityId: number,
  payload: {
    activity_date?: string
    start_time?: string
    estimated_cost?: string
  },
) {
  return api.put<TripActivity>(
    `/trips/${tripId}/activities/${activityId}`,
    payload,
  )
}


/* -------------------------------------------------------------------------- */
/* Budget                                                                     */
/* -------------------------------------------------------------------------- */

export function getTripBudget(
  tripId: number,
  signal?: AbortSignal,
) {
  return api.get<Budget>(
    `/trips/${tripId}/budget/`,
    signal,
  )
}


/* -------------------------------------------------------------------------- */
/* Smart Assistant                                                            */
/* -------------------------------------------------------------------------- */

export interface TripAssistant {
  trip_id: number
  overall_score: number
  summary: string

  budget: {
    allocated: string
    planned: string
    remaining: string
    utilization_percent: string
    status: string
    message: string
  }

  priority_warning: string | null
  priority_suggestion: string | null

  daily_insights: Array<{
    date: string
    activity_count: number
    planned_hours: number
    free_hours: number
    status: string
    message: string
  }>

  recommendations: Array<{
    id: number
    name: string
    category: string
    duration_hours: number
    estimated_cost: string
    reason: string
  }>

  total_free_hours: number
}

export function getTripAssistant(
  tripId: number,
  signal?: AbortSignal,
) {
  return api.get<TripAssistant>(
    `/trips/${tripId}/smart/assistant`,
    signal,
  )
}

export function optimizeTripDay(
  tripId: number,
  date: string,
) {
  return api.post<{
    trip_id: number
    date: string
    activities: Array<{
      trip_activity_id: number
      activity_id: number
      name: string
      activity_date: string
      start_time: string
      duration_hours: number
      estimated_cost: string
    }>
    total_planned_hours: number
    free_hours: number
    message: string
  }>(
    `/trips/${tripId}/smart/optimize-day?date=${encodeURIComponent(date)}`,
  )
}


/* -------------------------------------------------------------------------- */
/* Sharing                                                                    */
/* -------------------------------------------------------------------------- */

export function toggleTripSharing(
  tripId: number,
) {
  return api.patch<Trip>(
    `/trips/${tripId}/share`,
  )
}

export function getPublicTrip(
  shareCode: string,
  signal?: AbortSignal,
) {
  return api.get<PublicTrip>(
    `/public/trips/${shareCode}`,
    signal,
  )
}