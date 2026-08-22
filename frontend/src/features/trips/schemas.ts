import { z } from 'zod'

import { todayISO } from '@/lib/dates'

/**
 * Mirrors TripCreate in backend/schemas/trip.py, including the model
 * validator that rejects an end date before the start date.
 *
 * The past-date rules are stricter than the API's: you cannot plan a trip that
 * already started. The date inputs also carry `min` attributes, so the picker
 * greys those days out — these refinements are the backstop for typed input
 * and for browsers that ignore `min`.
 */

const money = z
  .string()
  .trim()
  .refine((value) => value === '' || Number(value) >= 0, 'Must be zero or more')
  .refine(
    (value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value),
    'Use at most two decimal places',
  )

export const tripSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name must be 150 characters or fewer'),
    description: z.string().trim().max(1000, 'Keep it under 1000 characters').optional(),
    start_date: z.string().min(1, 'Pick a start date'),
    end_date: z.string().min(1, 'Pick an end date'),
    accommodation_budget: money,
    transport_budget: money,
    meal_budget: money,
  })
  .refine((values) => values.start_date === '' || values.start_date >= todayISO(), {
    path: ['start_date'],
    message: 'Start date cannot be in the past',
  })
  .refine(
    (values) =>
      values.start_date === '' || values.end_date === '' || values.end_date >= values.start_date,
    {
      path: ['end_date'],
      message: 'End date must be on or after the start date',
    },
  )

export type TripFormValues = z.infer<typeof tripSchema>
