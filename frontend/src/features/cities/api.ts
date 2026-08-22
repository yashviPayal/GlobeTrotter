import { api } from '@/lib/api'
import type { Activity, City, Country } from '@/types/api'

export function listCities(signal?: AbortSignal) {
  return api.get<City[]>('/cities/', signal)
}

/** The API requires at least two characters, so callers must guard. */
export function searchCities(query: string, signal?: AbortSignal) {
  return api.get<City[]>(`/cities/search?query=${encodeURIComponent(query)}`, signal)
}

export function getCity(id: number, signal?: AbortSignal) {
  return api.get<City>(`/cities/${id}`, signal)
}

export function getCityActivities(id: number, signal?: AbortSignal) {
  return api.get<Activity[]>(`/cities/${id}/activities`, signal)
}

export function listCountries(signal?: AbortSignal) {
  return api.get<Country[]>('/countries/', signal)
}
