import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAuth } from '@/hooks/useAuth'
import { validatePassword, passwordRules } from '@/utils/validation'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { password: '' },
    onSubmit: async ({ value }) => {
      setError(null)

      const passErr = validatePassword(value.password)
      if (passErr) { setError(passErr); return }

      const err = await resetPassword(token!, value.password)
      if (err) { setError(err); return }
      navigate(APP_ROUTES.login, { replace: true })
    },
  })

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <p className="mb-4 text-sm text-neutral-500">
            This reset link is invalid or has expired.
          </p>
          <Link to={APP_ROUTES.forgotPassword} className="text-sm font-medium text-green-700 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Set new password</h1>
        <p className="mb-6 text-sm text-neutral-500">Choose a strong password for your account.</p>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="flex flex-col gap-4"
        >
          <form.Field name="password">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Input
                  label="New password"
                  type="password"
                  placeholder="••••••••"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  color="green"
                  required
                />
                {field.state.value && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    {passwordRules.map((rule) => (
                      <span
                        key={rule.label}
                        className={[
                          'flex items-center gap-1 text-xs',
                          rule.test(field.state.value) ? 'text-green-700' : 'text-neutral-400',
                        ].join(' ')}
                      >
                        <span>{rule.test(field.state.value) ? '✓' : '○'}</span>
                        {rule.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form.Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" color="green" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Set new password'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
