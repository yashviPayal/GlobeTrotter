import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { getMe, updateMe } from '@/features/auth/api'
import { StatTile } from '@/features/dashboard/StatTile'
import { listTrips } from '@/features/trips/api'
import { getTripDays, getTripStatus } from '@/features/trips/tripStatus'
import { ApiError } from '@/lib/api'
import { formatMoney, sum } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/auth'

/** Mirrors UserUpdate in backend/schemas/auth.py. */
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const setSession = useAuthStore((state) => state.login)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  // The server is the source of truth for the account; the store only caches
  // it for the header and the admin gate.
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: ({ signal }) => getMe(signal),
  })

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.all,
    queryFn: ({ signal }) => listTrips(signal),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const me = meQuery.data

  useEffect(() => {
    if (me) reset({ name: me.name, email: me.email })
  }, [me, reset])

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => updateMe(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated)
      if (token) setSession(token, updated)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const stats = useMemo(() => {
    const trips = tripsQuery.data ?? []
    const active = trips.filter((trip) => getTripStatus(trip) !== 'completed')

    return {
      total: trips.length,
      completed: trips.filter((trip) => getTripStatus(trip) === 'completed').length,
      days: active.reduce((total, trip) => total + getTripDays(trip), 0),
      spend: active.reduce(
        (total, trip) =>
          total + sum(trip.accommodation_budget, trip.transport_budget, trip.meal_budget),
        0,
      ),
    }
  }, [tripsQuery.data])

  const initials = (me?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted">
          Your account and how much travel you have planned.
        </p>
      </header>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-on-primary"
          >
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold">{me?.name ?? '—'}</p>
            <p className="mt-0.5 text-sm text-muted">{me?.email ?? ''}</p>
            {me?.role === 'admin' && (
              <span className="mt-1 inline-block rounded-full bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
                Admin
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)} disabled={!me}>
                Edit details
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Log out
            </Button>
          </div>
        </div>

        {saved && (
          <p role="status" className="text-sm text-success">
            Profile updated.
          </p>
        )}

        {editing && (
          <form
            noValidate
            className="flex flex-col gap-4 border-t border-hairline pt-5"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" error={errors.name?.message} {...register('name')} />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {mutation.isError && (
              <p role="alert" className="text-sm text-danger">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Could not save your details.'}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={mutation.isPending}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(false)
                  if (me) reset({ name: me.name, email: me.email })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Trips planned"
          value={String(stats.total)}
          detail={stats.completed > 0 ? `${stats.completed} completed` : undefined}
        />
        <StatTile label="Days on the road" value={String(stats.days)} detail="still ahead" />
        <StatTile
          label="Planned spend"
          value={formatMoney(stats.spend)}
          detail="across open trips"
        />
        <StatTile
          label="Completed"
          value={String(stats.completed)}
          detail={stats.completed === 1 ? 'trip finished' : 'trips finished'}
        />
      </dl>
    </section>
  )
}
