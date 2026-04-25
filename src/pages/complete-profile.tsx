import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/Button'
import { DatePicker } from '@/components/DatePicker'
import { Input } from '@/components/Input'
import { useAuth } from '@/hooks/useAuth'

export default function CompleteProfilePage() {
  const { user, logout, completeIndividualProfile, completeOrganizationProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      firstNameLat: '',
      lastNameLat: '',
      birthDate: undefined as Date | undefined,
      companyName: '',
      edrpou: '',
      legalAddress: '',
      companyNameLat: '',
      taxNumber: '',
      contactPersonName: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      let err: string | null
      if (user?.type === 'ORGANIZATION') {
        err = await completeOrganizationProfile({
          companyName: value.companyName,
          edrpou: value.edrpou,
          legalAddress: value.legalAddress,
          companyNameLat: value.companyNameLat || null,
          taxNumber: value.taxNumber || null,
          contactPersonName: value.contactPersonName || null,
        })
      } else {
        err = await completeIndividualProfile({
          firstName: value.firstName,
          lastName: value.lastName,
          middleName: value.middleName || null,
          firstNameLat: value.firstNameLat || null,
          lastNameLat: value.lastNameLat || null,
          birthDate: value.birthDate ? value.birthDate.toISOString().split('T')[0] : undefined,
        })
      }
      if (err) {
        setError(err)
      }
    },
  })

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

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-4"
        >
          {user.type === 'ORGANIZATION' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <form.Field name="companyName">
                  {(field) => (
                    <Input
                      label="Company name"
                      placeholder="Acme Corp"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      color="green"
                      required
                    />
                  )}
                </form.Field>
              </div>
              <form.Field name="edrpou">
                {(field) => (
                  <Input
                    label="EDRPOU"
                    placeholder="12345678"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                    required
                  />
                )}
              </form.Field>
              <form.Field name="taxNumber">
                {(field) => (
                  <Input
                    label="Tax number (optional)"
                    placeholder="1234567890"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                  />
                )}
              </form.Field>
              <div className="col-span-2">
                <form.Field name="legalAddress">
                  {(field) => (
                    <Input
                      label="Legal address"
                      placeholder="1 Main St, Kyiv, Ukraine"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      color="green"
                      required
                    />
                  )}
                </form.Field>
              </div>
              <div className="col-span-2">
                <form.Field name="companyNameLat">
                  {(field) => (
                    <Input
                      label="Company name (Latin, optional)"
                      placeholder="Acme Corp"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      color="green"
                    />
                  )}
                </form.Field>
              </div>
              <div className="col-span-2">
                <form.Field name="contactPersonName">
                  {(field) => (
                    <Input
                      label="Contact person name (optional)"
                      placeholder="John Doe"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      color="green"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="firstName">
                {(field) => (
                  <Input
                    label="First name"
                    placeholder="John"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                    required
                  />
                )}
              </form.Field>
              <form.Field name="lastName">
                {(field) => (
                  <Input
                    label="Last name"
                    placeholder="Doe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                    required
                  />
                )}
              </form.Field>
              <div className="col-span-2">
                <form.Field name="middleName">
                  {(field) => (
                    <Input
                      label="Middle name (optional)"
                      placeholder="Middle"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      color="green"
                    />
                  )}
                </form.Field>
              </div>
              <form.Field name="firstNameLat">
                {(field) => (
                  <Input
                    label="First name (Latin, optional)"
                    placeholder="John"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                  />
                )}
              </form.Field>
              <form.Field name="lastNameLat">
                {(field) => (
                  <Input
                    label="Last name (Latin, optional)"
                    placeholder="Doe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    color="green"
                  />
                )}
              </form.Field>
              <div className="col-span-2 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-gray-700">Date of birth (optional)</span>
                <form.Field name="birthDate">
                  {(field) => (
                    <DatePicker
                      value={field.state.value}
                      onChange={(date) => field.handleChange(date)}
                      placeholder="Select date"
                      color="green"
                    />
                  )}
                </form.Field>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <div className="mt-1 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  color="neutral"
                  className="flex-1"
                  disabled={isSubmitting || isCancelling}
                  onClick={handleCancel}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  color="green"
                  className="flex-1"
                  disabled={isSubmitting || isCancelling}
                >
                  {isSubmitting ? 'Saving...' : 'Save & continue'}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
