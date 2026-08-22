import clsx from 'clsx'
import { useState } from 'react'

import { cityImage } from '@/lib/images'

/**
 * A city photo that degrades to the city's initials — covering both a missing
 * image_url and a URL that fails to load.
 */
export function CityImage({
  name,
  url,
  width,
  className,
  priority = false,
}: {
  name: string
  url: string | null
  width: number
  className?: string
  /** Set on above-the-fold images — lazy loading only delays those. */
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : cityImage(name, url, width)

  if (!src) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-primary-tint',
          className,
        )}
      >
        <span className="font-display text-2xl font-bold text-primary">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
      className={clsx('object-cover', className)}
    />
  )
}
