/**
 * Mirrors backend/schemas/*.py.
 *
 * These types are the contract between the two halves of the app — when a
 * backend schema changes, this file changes with it and every consumer fails
 * to compile rather than failing at runtime.
 */

export interface User {
  id: number
  name: string
  email: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface City {
  id: number
  name: string
  country: string
  region: string | null
  cost_index: number
  popularity: number
  image_url: string | null
}

export interface Activity {
  id: number
  name: string
  description: string | null
  category: string
  duration_hours: number
  estimated_cost: number
  image_url: string | null
}

export interface Trip {
  id: number
  user_id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  accommodation_budget: number
  transport_budget: number
  meal_budget: number
  is_public: boolean
  share_code: string | null
}

export interface TripCreate {
  name: string
  description?: string | null
  start_date: string
  end_date: string
  accommodation_budget?: number
  transport_budget?: number
  meal_budget?: number
}

export type TripUpdate = Partial<TripCreate & { is_public: boolean }>

/**
 * Derived on the client from the date range — the API does not store it,
 * so it can never be stale. See docs/DATABASE.md.
 */
export type TripStatus = 'ongoing' | 'upcoming' | 'completed'
