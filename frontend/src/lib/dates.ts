/**
 * Date helpers for the plain YYYY-MM-DD strings the API exchanges.
 *
 * Everything works on the string form in the user's local calendar. Parsing to
 * a Date and back would drag timezones into a comparison that is really about
 * calendar days.
 */

/** Today as YYYY-MM-DD in the user's own timezone, not UTC. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

/** YYYY-MM-DD strings sort lexicographically, so plain compares are safe. */
export function isBefore(date: string, other: string): boolean {
  return date < other
}
