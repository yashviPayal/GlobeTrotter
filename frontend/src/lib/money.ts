/**
 * The API stores money as DECIMAL(12,2), and Pydantic v2 serialises Decimal to
 * a JSON string to avoid float rounding. Parsing happens here, once, so no
 * screen ever does arithmetic on a string.
 */

/** Accepts either wire form and returns a number, or 0 for anything unusable. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0

  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Sums money fields without accumulating float error at display scale. */
export function sum(...values: Array<string | number | null | undefined>): number {
  const cents = values.reduce<number>((total, value) => total + Math.round(toNumber(value) * 100), 0)
  return cents / 100
}

/**
 * The schema has no currency column, so the whole app commits to one unit.
 * USD matches the seeded activity costs (Eiffel Tower 25, Louvre 20, Burj
 * Khalifa 45 are all real USD prices). Change this one constant if the team
 * decides to store and display something else.
 */
export const CURRENCY = 'USD'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

export function formatMoney(value: string | number | null | undefined): string {
  return formatter.format(toNumber(value))
}
