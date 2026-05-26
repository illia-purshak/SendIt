import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAdmin2faSetupMutation, useAdmin2faVerifySetupMutation } from '@/api/admin-auth'
import { verify2faSchema } from '@/validation/auth'

type Verify2faValues = z.infer<typeof verify2faSchema>

export default function AdminAcceptInvite2faPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const setup2faMutation = useAdmin2faSetupMutation()
  const verifySetupMutation = useAdmin2faVerifySetupMutation()

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Verify2faValues>({
    resolver: zodResolver(verify2faSchema),
    defaultValues: { totpCode: '' },
  })

  useEffect(() => {
    if (!token) {
      navigate(APP_ROUTES.admin.acceptInvite, { replace: true })
      return
    }

    setup2faMutation.mutateAsync({ token }).then(data => {
      setQrCodeUrl(data.qrCodeUrl)
      setSecret(data.secret)
    }).catch(err => {
      setSetupError(err instanceof Error ? err.message : 'Failed to load QR code')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: Verify2faValues) {
    if (!token || !secret) return
    setSubmitError(null)
    try {
      await verifySetupMutation.mutateAsync({ token, secret, totpCode: values.totpCode })
      navigate(APP_ROUTES.admin.dashboard, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  if (!token) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Set up two-factor auth</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Scan the QR code with your authenticator app, then enter the 6-digit code to activate 2FA.
        </p>

        {setupError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{setupError}</p>
        )}

        {qrCodeUrl ? (
          <div className="mb-6 flex flex-col items-center gap-3">
            <img src={qrCodeUrl} alt="2FA QR code" className="h-48 w-48 rounded-lg border border-neutral-200" />
            {secret && (
              <div className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-center">
                <p className="mb-1 text-xs text-neutral-500">Manual entry code</p>
                <p className="font-mono text-sm font-medium tracking-widest text-neutral-700">{secret}</p>
              </div>
            )}
          </div>
        ) : !setupError ? (
          <div className="mb-6 flex h-48 items-center justify-center">
            <p className="text-sm text-neutral-400">Loading QR code…</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="totpCode"
            render={({ field, fieldState }) => (
              <Input
                label="Verification code"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                color="green"
                error={fieldState.error?.message}
                required
              />
            )}
          />

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
          )}

          <Button
            type="submit"
            color="green"
            className="mt-1 w-full"
            disabled={isSubmitting || !qrCodeUrl}
          >
            {isSubmitting ? 'Activating…' : 'Activate 2FA'}
          </Button>
        </form>
      </div>
    </div>
  )
}
