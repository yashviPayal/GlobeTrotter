/**
 * Mirrors backend/schemas/*.py.
 *
 * These types are the contract between the two halves of the app — when a
 * backend schema changes, this file changes with it and every consumer fails
 * to compile rather than failing at runtime.
 *
 * Money is DECIMAL(12,2) server-side and arrives as a JSON string, so it is
 * typed as `Money` and parsed through lib/money.ts rather than used directly.
 */

/** A DECIMAL(12,2) as it arrives over the wire. Parse with toNumber(). */
export type Money = string | number

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

export interface Country {
  id: number
  name: string
  code: string
}

export interface City {
  id: number
  name: string
  country_id: number
  /** Nested so a city can render as "Paris, France" without a second request. */
  country: Country
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
  estimated_cost: Money
  image_url: string | null
}

export interface Trip {
  id: number
  user_id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  accommodation_budget: Money
  transport_budget: Money
  meal_budget: Money
  is_public: boolean
  share_code: string | null
  created_at: string
  updated_at: string
}

export interface TripCreate {
  name: string
  description?: string | null
  start_date: string
  end_date: string
  accommodation_budget?: Money
  transport_budget?: Money
  meal_budget?: Money
}

export type TripUpdate = Partial<TripCreate & { is_public: boolean }>

/**
 * Derived on the client from the date range — the API does not store it,
 * so it can never be stale. See docs/DATABASE.md.
 */
export type TripStatus = 'ongoing' | 'upcoming' | 'completed'
