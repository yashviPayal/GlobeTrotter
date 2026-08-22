import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

import { AuthLayout } from './AuthLayout'
import { login, register as registerUser } from './api'
import { registerSchema, type RegisterValues } from './schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    // Register does not return a token, so sign the new user straight in
    // rather than making them retype what they just entered.
    mutationFn: async (values: RegisterValues) => {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      })

      return login({ email: values.email, password: values.password })
    },
    onSuccess: (data) => {
      setSession(data.access_token, data.user)
      navigate('/', { replace: true })
    },
  })

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning your first trip in a couple of minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Mohil Pipaliya"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8 characters or more."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {mutation.isError && (
          <p role="alert" className="text-sm text-danger">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : 'Could not reach the server. Is the API running?'}
          </p>
        )}

        <Button type="submit" loading={mutation.isPending} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
