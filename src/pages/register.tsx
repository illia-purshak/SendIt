import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { RadioGroup, RadioItem } from '@/components/Radio'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAuth } from '@/hooks/useAuth'
import { validateEmail, validatePhone, validatePassword, passwordRules } from '@/utils/validation'
import type { UserType } from '@/types/auth'

export default function RegisterPage() {
  const { register, user } = useAuth()
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
    defaultValues: {
      type: 'INDIVIDUAL' as UserType,
      email: '',
      phone: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)

      const emailErr = validateEmail(value.email)
      if (emailErr) { setError(emailErr); return }

      if (value.phone) {
        const phoneErr = validatePhone(value.phone)
        if (phoneErr) { setError(phoneErr); return }
      }

      const passErr = validatePassword(value.password)
      if (passErr) { setError(passErr); return }

      const err = await register({
        type: value.type,
        email: value.email,
        phone: value.phone || undefined,
        password: value.password,
      })
      if (err) { setError(err); return }
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Create account</h1>
        <p className="mb-6 text-sm text-neutral-500">Join SendIt today</p>

        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Account type</span>
            <form.Field name="type">
              {(field) => (
                <RadioGroup
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as UserType)}
                  color="green"
                  className="flex-row gap-6"
                >
                  <RadioItem value="INDIVIDUAL" label="Individual" />
                  <RadioItem value="ORGANIZATION" label="Organization" />
                </RadioGroup>
              )}
            </form.Field>
          </div>

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

          <form.Field name="phone">
            {(field) => (
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+380501234567"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                color="green"
              />
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Password"
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
              <Button type="submit" color="green" className="mt-1 w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to={APP_ROUTES.login} className="font-medium text-green-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
