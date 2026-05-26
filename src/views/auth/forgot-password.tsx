import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAuth } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/validation/auth'
import type { z } from 'zod'

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setError(null)
    const err = await forgotPassword(values.email)
    if (err) { setError(err); return }
    setSubmittedEmail(values.email)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        {sent ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 text-xl">
              ✓
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Check your email</h1>
            <p className="mb-6 text-sm text-neutral-500">
              We sent a password reset link to{' '}
              <span className="font-medium text-neutral-700">{submittedEmail}</span>.
              The link expires in 1 hour.
            </p>
            <Link to={APP_ROUTES.login} className="text-sm font-medium text-green-700 hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Forgot password?</h1>
            <p className="mb-6 text-sm text-neutral-500">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <Button type="submit" color="green" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              <Link to={APP_ROUTES.login} className="font-medium text-green-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
