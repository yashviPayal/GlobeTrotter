/**
 * Seed image URLs point at Unsplash originals — the city grid was pulling
 * 58 MB across 15 cards, with the largest single image at 9.5 MB.
 *
 * Unsplash serves a resizing CDN from the same URL, so asking for the width we
 * actually render turns each of those into tens of kilobytes. Any other host
 * is returned untouched.
 */
const UNSPLASH_HOST = 'images.unsplash.com'

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
