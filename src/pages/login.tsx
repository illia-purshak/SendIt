import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    navigate(
      user.profileCompleted ? APP_ROUTES.home : APP_ROUTES.completeProfile,
      { replace: true },
    )
  }, [navigate, user])

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      const err = await login(value.email, value.password)
      if (err) { setError(err); return }
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Sign in</h1>
        <p className="mb-6 text-sm text-neutral-500">Welcome back to SendIt</p>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="flex flex-col gap-4"
        >
          <form.Field name="email">
            {(field) => (
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                color="green"
                required
              />
            )}
          </form.Field>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <Link to={APP_ROUTES.forgotPassword} className="text-xs text-green-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <form.Field name="password">
              {(field) => (
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  color="green"
                  required
                />
              )}
            </form.Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" color="green" className="mt-1 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link to={APP_ROUTES.register} className="font-medium text-green-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
