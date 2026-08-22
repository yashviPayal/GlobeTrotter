import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ApiError } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Trip } from '@/types/api'

import { toggleTripSharing } from './api'

/**
 * Publishes a read-only copy of the itinerary at a share code.
 *
 * The link is shown as selectable text as well as a copy button, since the
 * Clipboard API needs a secure context and silently refuses in some browsers.
 */
export function ShareControl({ trip }: { trip: Trip }) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)

  const shareUrl = trip.share_code
    ? `${window.location.origin}/p/${trip.share_code}`
    : null

  const mutation = useMutation({
    mutationFn: () => toggleTripSharing(trip.id),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.trips.detail(trip.id), updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all })
    },
  })

  async function copy() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — the link is on screen to copy by hand.
      setCopied(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {trip.is_public ? 'Shared publicly' : 'Private trip'}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {trip.is_public
              ? 'Anyone with the link can view this itinerary, read-only.'
              : 'Only you can see this trip. Share it to get a public link.'}
          </p>
        </div>

        <Button
          size="sm"
          variant={trip.is_public ? 'secondary' : 'primary'}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {trip.is_public ? 'Make private' : 'Share trip'}
        </Button>
      </div>

      {trip.is_public && shareUrl && (
        <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
          <code className="min-w-0 flex-1 truncate rounded-control bg-canvas px-3 py-2 text-xs text-muted">
            {shareUrl}
          </code>
          <Button size="sm" variant="secondary" onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      )}

      {mutation.isError && (
        <p role="alert" className="text-sm text-danger">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'Could not change sharing.'}
        </p>
      )}
    </Card>
  )
}
