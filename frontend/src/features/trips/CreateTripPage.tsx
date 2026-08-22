import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api'
import { formatMoney, sum } from '@/lib/money'
import { queryKeys } from '@/lib/queryKeys'

import { createTrip } from './api'
import { tripSchema, type TripFormValues } from './schemas'

/** Empty budget fields mean zero, which is what the API defaults to. */
function toAmount(value: string): string {
  return value.trim() === '' ? '0' : value.trim()
}

export function CreateTripPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      accommodation_budget: '',
      transport_budget: '',
      meal_budget: '',
    },
  })

  // Live total, so the budget is visible while it is being decided rather
  // than only after the trip is saved.
  const total = sum(
    watch('accommodation_budget'),
    watch('transport_budget'),
    watch('meal_budget'),
  )

  const mutation = useMutation({
    mutationFn: (values: TripFormValues) =>
      createTrip({
        name: values.name,
        description: values.description?.trim() || null,
        start_date: values.start_date,
        end_date: values.end_date,
        accommodation_budget: toAmount(values.accommodation_budget),
        transport_budget: toAmount(values.transport_budget),
        meal_budget: toAmount(values.meal_budget),
      }),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips.all })
      navigate(`/trips/${trip.id}`)
    },
  })

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Plan a new trip</h1>
        <p className="mt-1 text-sm text-muted">
          Name it and set the dates. You can add cities and activities next.
        </p>
      </header>

      <Card className="p-6">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <Input
            label="Trip name"
            placeholder="Golden Triangle, Winter 2027"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-ink">
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="What is this trip about?"
              className="rounded-control border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-danger">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              error={errors.start_date?.message}
              {...register('start_date')}
            />
            <Input
              label="End date"
              type="date"
              error={errors.end_date?.message}
              {...register('end_date')}
            />
          </div>

          <fieldset className="flex flex-col gap-3 rounded-card border border-hairline p-4">
            <legend className="px-1 text-sm font-medium text-ink">Estimated budget</legend>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Stay"
                inputMode="decimal"
                placeholder="0"
                error={errors.accommodation_budget?.message}
                {...register('accommodation_budget')}
              />
              <Input
                label="Transport"
                inputMode="decimal"
                placeholder="0"
                error={errors.transport_budget?.message}
                {...register('transport_budget')}
              />
              <Input
                label="Meals"
                inputMode="decimal"
                placeholder="0"
                error={errors.meal_budget?.message}
                {...register('meal_budget')}
              />
            </div>

            <p className="text-sm text-muted">
              Total <span className="font-semibold text-ink">{formatMoney(total)}</span>
            </p>
          </fieldset>

          {mutation.isError && (
            <p role="alert" className="text-sm text-danger">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Could not save the trip.'}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={mutation.isPending}>
              Create trip
            </Button>
            <Link to="/trips">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </section>
  )
}
