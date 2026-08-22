import { api, request } from '@/lib/api'
import type {
  Budget,
  StopCreate,
  Trip,
  TripActivity,
  TripActivityCreate,
  TripCreate,
  TripStop,
  TripUpdate,
  PublicTrip,
} from '@/types/api'

export function listTrips(signal?: AbortSignal) {
  return api.get<Trip[]>('/trips/', signal)
}

export function getTrip(id: number, signal?: AbortSignal) {
  return api.get<Trip>(`/trips/${id}`, signal)
}

export function createTrip(payload: TripCreate) {
  return api.post<Trip>('/trips/', payload)
}

export function updateTrip(id: number, payload: TripUpdate) {
  return api.put<Trip>(`/trips/${id}`, payload)
}

export function deleteTrip(id: number) {
  return api.delete<void>(`/trips/${id}`)
}

/* ---------- Stops ---------- */

export function listStops(tripId: number, signal?: AbortSignal) {
  return api.get<TripStop[]>(`/trips/${tripId}/stops/`, signal)
}

export function createStop(tripId: number, payload: StopCreate) {
  return api.post<TripStop>(`/trips/${tripId}/stops/`, payload)
}

export function deleteStop(tripId: number, stopId: number) {
  return api.delete<void>(`/trips/${tripId}/stops/${stopId}`)
}

/* ---------- Trip activities ---------- */

export function listTripActivities(tripId: number, signal?: AbortSignal) {
  return api.get<TripActivity[]>(`/trips/${tripId}/activities/`, signal)
}

export function createTripActivity(tripId: number, payload: TripActivityCreate) {
  return api.post<TripActivity>(`/trips/${tripId}/activities/`, payload)
}

export function deleteTripActivity(tripId: number, tripActivityId: number) {
  return api.delete<void>(`/trips/${tripId}/activities/${tripActivityId}`)
}

/* ---------- Budget ---------- */

export function getTripBudget(tripId: number, signal?: AbortSignal) {
  return api.get<Budget>(`/trips/${tripId}/budget/`, signal)
}

/* ---------- Sharing ---------- */

/** Toggles public visibility and returns the trip with its share_code. */
export function toggleTripSharing(tripId: number) {
  return request<Trip>(`/trips/${tripId}/share`, { method: 'PATCH' })
}

export function getPublicTrip(shareCode: string, signal?: AbortSignal) {
  return api.get<PublicTrip>(`/public/trips/${shareCode}`, signal)
}
