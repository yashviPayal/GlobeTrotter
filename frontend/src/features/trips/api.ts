import { api } from '@/lib/api'
import type { Trip, TripCreate, TripUpdate } from '@/types/api'

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
