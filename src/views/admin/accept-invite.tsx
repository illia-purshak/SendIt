import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Spinner } from '@/components/Loader/Spinner'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAdminValidateInviteQuery, useAdminSetPasswordMutation, useAdmin2faSetupMutation } from '@/api/admin-auth'
import { useToast } from '@/components/Toast/use-toast'
import { ApiValidationError } from '@/utils/parseApiError'
import { setPasswordSchema, passwordRules } from '@/validation/auth'

type SetPasswordValues = z.infer<typeof setPasswordSchema>

function InviteErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">{message}</p>
      </div>
    </div>
  )
}

export default function AdminAcceptInvitePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const setPasswordMutation = useAdminSetPasswordMutation()
  const setup2faMutation = useAdmin2faSetupMutation()

  const { data, isLoading, error } = useAdminValidateInviteQuery(token)

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = useWatch({ control, name: 'password' })

  if (!token) {
    return (
      <InviteErrorCard
        title="Invalid invite link"
        message="This invite link is missing a token. Please use the link from your invitation email."
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    )
  }

  if (error) {
    const err = error as Error & { status?: number; code?: string }
    if (err.status === 410 && err.code === 'INVITE_EXPIRED') {
      return (
        <InviteErrorCard
          title="Invite expired"
          message="This invite has expired. Contact your administrator to request a new one."
        />
      )
    }
    if (err.status === 410 && err.code === 'INVITE_ALREADY_USED') {
      return (
        <InviteErrorCard
          title="Invite already used"
          message="This invite has already been used. Try signing in or contact your administrator."
        />
      )
    }
    return (
      <InviteErrorCard
        title="Invite not found"
        message="This invite link is invalid. Please use the link from your invitation email."
      />
    )
  }

  async function onSubmit(values: SetPasswordValues) {
    if (!token) return
    try {
      await setPasswordMutation.mutateAsync({ token, password: values.password })
      const { qrCodeUrl, secret } = await setup2faMutation.mutateAsync({ token })
      navigate(APP_ROUTES.admin.setup2fa, { state: { qrCodeUrl, secret, token } })
    } catch (err) {
      if (err instanceof ApiValidationError && err.validationDetails.length > 0) {
        toast({ title: err.message, description: err.validationDetails.join('\n'), color: 'error' })
      } else {
        toast({ title: err instanceof Error ? err.message : 'An unexpected error occurred', color: 'error' })
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Accept invitation</h1>
        <p className="mb-6 text-sm text-neutral-500">Set a password to create your admin account.</p>

        <div className="mb-5 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Invited as <span className="font-medium">{data?.email}</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="teal"
                  error={fieldState.error?.message}
                  required
                />
                {password && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    {passwordRules.map(rule => (
                      <span
                        key={rule.label}
                        className={[
                          'flex items-center gap-1 text-xs',
                          rule.test(password) ? 'text-teal-700' : 'text-neutral-400',
                        ].join(' ')}
                      >
                        <span>{rule.test(password) ? '✓' : '○'}</span>
                        {rule.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                color="teal"
                error={fieldState.error?.message}
                required
              />
            )}
          />

          <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
