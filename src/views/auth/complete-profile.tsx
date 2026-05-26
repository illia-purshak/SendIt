import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useAuth } from '@/hooks/useAuth'
import { APP_ROUTES } from '@/constants/app-routes'
import { organizationProfileSchema } from '@/validation/auth'
import type { z } from 'zod'

type OrgValues = z.infer<typeof organizationProfileSchema>

export default function CompleteProfilePage() {
  const { completeOrganizationProfile } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<OrgValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      companyName: '',
      edrpou: '',
      legalAddress: '',
      companyNameLat: '',
      taxNumber: '',
      contactPersonName: '',
    },
  })

  function handleCancel() {
    navigate(APP_ROUTES.login)
  }

  async function onSubmit(values: OrgValues) {
    setError(null)
    const err = await completeOrganizationProfile({
      companyName: values.companyName,
      edrpou: values.edrpou,
      legalAddress: values.legalAddress,
      companyNameLat: values.companyNameLat || null,
      taxNumber: values.taxNumber || null,
      contactPersonName: values.contactPersonName || null,
    })
    if (err) {
      setError(err)
    } else {
      navigate(APP_ROUTES.dashboard)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Complete your profile</h1>
        <p className="mb-6 text-sm text-neutral-500">Tell us about your organization.</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Controller
                control={control}
                name="companyName"
                render={({ field, fieldState }) => (
                  <Input
                    label="Company name"
                    placeholder="Acme Corp"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />
            </div>
            <Controller
              control={control}
              name="edrpou"
              render={({ field, fieldState }) => (
                <Input
                  label="EDRPOU"
                  placeholder="12345678"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="green"
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
            <Controller
              control={control}
              name="taxNumber"
              render={({ field }) => (
                <Input
                  label="Tax number (optional)"
                  placeholder="1234567890"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="green"
                />
              )}
            />
            <div className="col-span-2">
              <Controller
                control={control}
                name="legalAddress"
                render={({ field, fieldState }) => (
                  <Input
                    label="Legal address"
                    placeholder="1 Main St, Kyiv, Ukraine"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Controller
                control={control}
                name="companyNameLat"
                render={({ field }) => (
                  <Input
                    label="Company name (Latin, optional)"
                    placeholder="Acme Corp"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Controller
                control={control}
                name="contactPersonName"
                render={({ field }) => (
                  <Input
                    label="Contact person name (optional)"
                    placeholder="John Doe"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-1 flex gap-3">
            <Button
              type="button"
              variant="outline"
              color="neutral"
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" color="green" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save & continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
