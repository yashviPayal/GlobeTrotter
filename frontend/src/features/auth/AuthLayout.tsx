import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { listCities } from '@/features/cities/api'
import { cityImage } from '@/lib/images'

/**
 * Shared frame for log in and register, so the two screens are visibly one
 * product rather than two forms that happen to sit next to each other.
 *
 * The panel shows a real destination from the catalogue — /api/cities is
 * public, so this works before sign-in — and falls back to the flat brand
 * colour if the request or the image fails.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  const { data } = useQuery({
    queryKey: ['cities'],
    queryFn: ({ signal }) => listCities(signal),
    staleTime: 5 * 60_000,
  })

  // One of the most popular destinations, varied per visit so the screen does
  // not feel static, but fixed for the lifetime of this mount.
  const feature = useMemo(() => {
    const withImages = (data ?? []).filter((city) => city.image_url)
    if (withImages.length === 0) return null

    return withImages[Math.floor(Math.random() * Math.min(withImages.length, 6))] ?? null
  }, [data])

  const background = feature ? cityImage(feature.name, feature.image_url, 1200) : null

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        {background && (
          <>
            <img
              src={background}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
            {/* Keeps the copy legible whatever the photo happens to be. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
            />
          </>
        )}

        <span className="relative font-display text-xl font-bold">
          Globe<span className="text-primary">Trotter</span>
        </span>

        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-snug">
            Plan multi-city trips without losing track of the budget.
          </p>
          <p className="mt-4 text-sm text-white/80">
            Build a day-wise itinerary, discover cities and activities, and watch the cost
            update as the plan changes.
          </p>
        </div>

        <div className="relative flex items-end justify-between gap-4">
          <p className="text-xs text-white/60">Odoo x LDCE Hackathon</p>
          {feature && (
            <p className="text-xs text-white/70">
              {feature.name}, {feature.country.name}
            </p>
          )}
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-sm text-muted">{footer}</div>
        </div>
      </main>
    </div>
  )
}
