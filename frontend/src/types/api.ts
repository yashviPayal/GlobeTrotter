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

/* ---------- Itinerary ---------- */

export interface StopCity {
  id: number
  name: string
  country_id: number
  country: Country
  region: string | null
  cost_index: number
  popularity: number
  image_url: string | null
}

export interface TripStop {
  id: number
  trip_id: number
  city_id: number
  start_date: string
  end_date: string
  sequence: number
  city: StopCity
}

export interface StopCreate {
  city_id: number
  start_date: string
  end_date: string
}

export interface ActivitySummary {
  id: number
  name: string
  description: string | null
  category: string
  duration_hours: number
  estimated_cost: Money
  image_url: string | null
}

export interface TripActivity {
  id: number
  trip_id: number
  trip_stop_id: number
  activity_id: number
  activity_date: string
  start_time: string | null
  estimated_cost: Money
  activity: ActivitySummary
}

export interface TripActivityCreate {
  trip_stop_id: number
  activity_id: number
  activity_date?: string | null
  start_time?: string | null
  estimated_cost?: Money | null
}

/* ---------- Budget ---------- */

export interface BudgetCategory {
  allocated: Money
  planned: Money
  remaining: Money
}

export interface Budget {
  trip_id: number
  accommodation: BudgetCategory
  transport: BudgetCategory
  meals: BudgetCategory
  activities: BudgetCategory
  total_allocated: Money
  total_planned: Money
  remaining: Money
  utilization_percent: Money
}

/* ---------- Public sharing ---------- */

export interface PublicActivity {
  id: number
  name: string
  category: string
  duration_hours: number
  estimated_cost: Money
  activity_date: string
  start_time: string | null
}

export interface PublicStop {
  id: number
  sequence: number
  city_name: string
  country_name: string
  start_date: string
  end_date: string
  activities: PublicActivity[]
}

export interface PublicBudget {
  accommodation: Money
  transport: Money
  meals: Money
  activities: Money
  total_allocated: Money
  total_planned: Money
  remaining: Money
  utilization_percent: Money
}

export interface PublicTrip {
  name: string
  description: string | null
  start_date: string
  end_date: string
  stops: PublicStop[]
  budget: PublicBudget
}
