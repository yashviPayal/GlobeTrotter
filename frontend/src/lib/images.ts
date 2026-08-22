/**
 * Seed image URLs point at Unsplash originals — the city grid was pulling
 * 58 MB across 15 cards, with the largest single image at 9.5 MB.
 *
 * Unsplash serves a resizing CDN from the same URL, so asking for the width we
 * actually render turns each of those into tens of kilobytes. Any other host
 * is returned untouched.
 */
const UNSPLASH_HOST = 'images.unsplash.com'

/**
 * Cities we ship a local photo for, in public/cities. Served from our own
 * origin, so the grid does not depend on a third party being reachable — and
 * they are already sized, unlike the originals the seed URLs point at.
 */
const LOCAL_CITY_IMAGES = new Set([
  'ahmedabad',
  'amsterdam',
  'bengaluru',
  'delhi',
  'dubai',
  'goa',
  'hyderabad',
  'jaipur',
  'kochi',
  'london',
  'manali',
  'mumbai',
  'paris',
  'rome',
  'tokyo',
])

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Prefers the bundled photo for a city, falling back to whatever the database
 * holds for anything we do not ship an image for.
 */
export function cityImage(name: string, url: string | null, width: number): string | null {
  const slug = slugify(name)

  if (LOCAL_CITY_IMAGES.has(slug)) return `/cities/${slug}.jpg`

  return sizedImage(url, width)
}

export function sizedImage(url: string | null, width: number): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (parsed.hostname !== UNSPLASH_HOST) return url

    parsed.searchParams.set('w', String(width))
    parsed.searchParams.set('q', '70')
    parsed.searchParams.set('auto', 'format')
    parsed.searchParams.set('fit', 'crop')

    return parsed.toString()
  } catch {
    // A malformed URL is not worth throwing over — render it and let the
    // element's own error handling deal with it.
    return url
  }
}
