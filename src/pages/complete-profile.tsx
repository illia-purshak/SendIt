import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/Button'
import { DatePicker } from '@/components/DatePicker'
import { Input } from '@/components/Input'
import { useAuth } from '@/hooks/useAuth'
import { individualProfileSchema, organizationProfileSchema } from '@/validation/auth'
import type { z } from 'zod'

type IndividualValues = z.infer<typeof individualProfileSchema>
type OrgValues = z.infer<typeof organizationProfileSchema>

interface ProfileFormProps {
  onError: (err: string | null) => void
  onCancel: () => void
  isCancelling: boolean
}

function IndividualProfileForm({ onError, onCancel, isCancelling }: ProfileFormProps) {
  const { completeIndividualProfile } = useAuth()
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<IndividualValues>({
    resolver: zodResolver(individualProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      firstNameLat: '',
      lastNameLat: '',
      birthDate: undefined,
    },
  })

  async function onSubmit(values: IndividualValues) {
    onError(null)
    const err = await completeIndividualProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      middleName: values.middleName || null,
      firstNameLat: values.firstNameLat || null,
      lastNameLat: values.lastNameLat || null,
      birthDate: values.birthDate ? values.birthDate.toISOString().split('T')[0] : undefined,
    })
    if (err) onError(err)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Input
              label="First name"
              placeholder="John"
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
          name="lastName"
          render={({ field, fieldState }) => (
            <Input
              label="Last name"
              placeholder="Doe"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              color="green"
              error={fieldState.error?.message}
              required
            />
          )}
        />
        <div className="col-span-2">
          <Controller
            control={control}
            name="middleName"
            render={({ field }) => (
              <Input
                label="Middle name (optional)"
                placeholder="Middle"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                color="green"
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="firstNameLat"
          render={({ field }) => (
            <Input
              label="First name (Latin, optional)"
              placeholder="John"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              color="green"
            />
          )}
        />
        <Controller
          control={control}
          name="lastNameLat"
          render={({ field }) => (
            <Input
              label="Last name (Latin, optional)"
              placeholder="Doe"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              color="green"
            />
          )}
        />
        <div className="col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Date of birth (optional)</span>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Select date"
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
          disabled={isSubmitting || isCancelling}
          onClick={onCancel}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </Button>
        <Button type="submit" color="green" className="flex-1" disabled={isSubmitting || isCancelling}>
          {isSubmitting ? 'Saving...' : 'Save & continue'}
        </Button>
      </div>
    </form>
  )
}

function OrgProfileForm({ onError, onCancel, isCancelling }: ProfileFormProps) {
  const { completeOrganizationProfile } = useAuth()
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

  async function onSubmit(values: OrgValues) {
    onError(null)
    const err = await completeOrganizationProfile({
      companyName: values.companyName,
      edrpou: values.edrpou,
      legalAddress: values.legalAddress,
      companyNameLat: values.companyNameLat || null,
      taxNumber: values.taxNumber || null,
      contactPersonName: values.contactPersonName || null,
    })
    if (err) onError(err)
  }

  return (
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
          disabled={isSubmitting || isCancelling}
          onClick={onCancel}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </Button>
        <Button type="submit" color="green" className="flex-1" disabled={isSubmitting || isCancelling}>
          {isSubmitting ? 'Saving...' : 'Save & continue'}
        </Button>
      </div>
    </form>
  )
}

export default function CompleteProfilePage() {
  const { user, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  if (!user) return null

  function handleCancel() {
    setIsCancelling(true)
    logout()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Complete your profile</h1>
        <p className="mb-6 text-sm text-neutral-500">
          {user.type === 'ORGANIZATION'
            ? 'Tell us about your organization.'
            : 'Tell us a bit about yourself.'}
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {user.type === 'ORGANIZATION' ? (
          <OrgProfileForm onError={setError} onCancel={handleCancel} isCancelling={isCancelling} />
        ) : (
          <IndividualProfileForm onError={setError} onCancel={handleCancel} isCancelling={isCancelling} />
        )}
      </div>
    </div>
  )
}
