import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Spinner } from '@/components/Loader/Spinner'
import {
  useCreateRecipientMutation,
  useRecipientQuery,
  useUpdateRecipientMutation,
} from '@/api/recipients'
import { useToast } from '@/components/Toast/use-toast'
import type {
  Recipient,
  RecipientAddress,
  RecipientAddressType,
  RecipientBody,
  RecipientType,
} from '@/types/recipient'

const RECIPIENT_TYPE_OPTIONS: { value: RecipientType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'ORGANIZATION', label: 'Organization' },
]

const ADDRESS_TYPE_OPTIONS: { value: RecipientAddressType; label: string }[] = [
  { value: 'BRANCH', label: 'Branch pickup' },
  { value: 'STREET', label: 'Street delivery' },
]

const recipientFormSchema = z
  .object({
    type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
    firstName: z.string(),
    lastName: z.string(),
    patronymic: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string(),
    companyName: z.string(),
    ownershipForm: z.string(),
    edrpou: z.string(),
    addressType: z.enum(['', 'BRANCH', 'STREET']),
    city: z.string(),
    branchNumber: z.string(),
    street: z.string(),
    building: z.string(),
    flat: z.string(),
    postCode: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.phone.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Phone is required',
      })
    }

    if (values.type === 'INDIVIDUAL') {
      if (!values.firstName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstName'],
          message: 'First name is required',
        })
      }
      if (!values.lastName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lastName'],
          message: 'Last name is required',
        })
      }
    }

    if (values.type === 'ORGANIZATION' && !values.companyName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name is required',
      })
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Enter a valid email address',
      })
    }

    if (values.addressType) {
      if (!values.city.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['city'],
          message: 'City is required',
        })
      }

      if (values.addressType === 'BRANCH' && !values.branchNumber.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['branchNumber'],
          message: 'Branch number is required',
        })
      }

      if (values.addressType === 'STREET') {
        if (!values.street.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['street'],
            message: 'Street is required',
          })
        }
        if (!values.building.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['building'],
            message: 'Building is required',
          })
        }
      }
    }
  })

type RecipientFormValues = z.infer<typeof recipientFormSchema>

const EMPTY_VALUES: RecipientFormValues = {
  type: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  patronymic: '',
  phone: '',
  email: '',
  note: '',
  companyName: '',
  ownershipForm: '',
  edrpou: '',
  addressType: '',
  city: '',
  branchNumber: '',
  street: '',
  building: '',
  flat: '',
  postCode: '',
}

interface RecipientFormModalProps {
  open: boolean
  recipientId: number | null
  onClose: () => void
}

function toFormValues(recipient: Recipient): RecipientFormValues {
  return {
    type: recipient.type,
    firstName: recipient.firstName ?? '',
    lastName: recipient.lastName ?? '',
    patronymic: recipient.patronymic ?? '',
    phone: recipient.phone ?? '',
    email: recipient.email ?? '',
    note: recipient.note ?? '',
    companyName: recipient.companyName ?? '',
    ownershipForm: recipient.ownershipForm ?? '',
    edrpou: recipient.edrpou ?? '',
    addressType: recipient.address?.type ?? '',
    city: recipient.address?.city ?? '',
    branchNumber: recipient.address?.branchNumber ?? '',
    street: recipient.address?.street ?? '',
    building: recipient.address?.building ?? '',
    flat: recipient.address?.flat ?? '',
    postCode: recipient.address?.postCode ?? '',
  }
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildAddress(values: RecipientFormValues): RecipientAddress | null {
  if (!values.addressType) return null

  if (values.addressType === 'BRANCH') {
    return {
      type: 'BRANCH',
      city: values.city.trim(),
      branchNumber: values.branchNumber.trim(),
    }
  }

  return {
    type: 'STREET',
    city: values.city.trim(),
    street: values.street.trim(),
    building: values.building.trim(),
    flat: trimToNull(values.flat) ?? undefined,
    postCode: trimToNull(values.postCode) ?? undefined,
  }
}

function buildBody(values: RecipientFormValues): RecipientBody {
  return {
    type: values.type,
    firstName: trimToNull(values.firstName),
    lastName: trimToNull(values.lastName),
    patronymic: trimToNull(values.patronymic),
    phone: values.phone.trim(),
    email: trimToNull(values.email),
    note: trimToNull(values.note),
    companyName: trimToNull(values.companyName),
    ownershipForm: trimToNull(values.ownershipForm),
    edrpou: trimToNull(values.edrpou),
    address: buildAddress(values),
  }
}

export function RecipientFormModal({ open, recipientId, onClose }: RecipientFormModalProps) {
  const { toast } = useToast()
  const isEdit = recipientId != null
  const [apiError, setApiError] = useState<string | null>(null)
  const {
    data: recipient,
    isLoading,
    error: loadError,
  } = useRecipientQuery(recipientId ?? 0, open && isEdit)
  const { mutateAsync: createRecipient, isPending: isCreating } = useCreateRecipientMutation()
  const { mutateAsync: updateRecipient, isPending: isUpdating } = useUpdateRecipientMutation()

  const form = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const recipientType = form.watch('type')
  const addressType = form.watch('addressType')
  const isPending = isCreating || isUpdating

  useEffect(() => {
    if (!open) return
    setApiError(null)
    if (!isEdit) {
      form.reset(EMPTY_VALUES)
    }
  }, [form, isEdit, open])

  useEffect(() => {
    if (!open || !recipient) return
    form.reset(toFormValues(recipient))
  }, [form, open, recipient])

  const title = useMemo(() => (isEdit ? 'Edit recipient' : 'Add recipient'), [isEdit])

  function handleClose() {
    form.reset(EMPTY_VALUES)
    setApiError(null)
    onClose()
  }

  async function onSubmit(values: RecipientFormValues) {
    setApiError(null)

    try {
      if (isEdit && recipientId != null) {
        await updateRecipient({ id: recipientId, body: buildBody(values) })
        toast({ title: 'Recipient updated', color: 'success' })
      } else {
        await createRecipient(buildBody(values))
        toast({ title: 'Recipient created', color: 'success' })
      }
      handleClose()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save recipient')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-[dialog-overlay-in_200ms_ease]',
            'data-[state=closed]:animate-[dialog-overlay-out_150ms_ease]',
          ].join(' ')}
        />
        <Dialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl',
            'data-[state=open]:animate-[dialog-in_200ms_ease]',
            'data-[state=closed]:animate-[dialog-out_150ms_ease]',
          ].join(' ')}
        >
          <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-sm text-neutral-500">
            Save recipient details and delivery data to reuse them in shipment creation.
          </Dialog.Description>

          {isEdit && isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : isEdit && loadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError instanceof Error ? loadError.message : 'Failed to load recipient'}
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Recipient type
                  </label>
                  <select
                    {...form.register('type')}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {RECIPIENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {recipientType === 'INDIVIDUAL' ? (
                  <>
                    <Input
                      label="First name"
                      {...form.register('firstName')}
                      error={form.formState.errors.firstName?.message}
                    />
                    <Input
                      label="Last name"
                      {...form.register('lastName')}
                      error={form.formState.errors.lastName?.message}
                    />
                    <Input
                      label="Patronymic"
                      {...form.register('patronymic')}
                      error={form.formState.errors.patronymic?.message}
                    />
                  </>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <Input
                        label="Company name"
                        {...form.register('companyName')}
                        error={form.formState.errors.companyName?.message}
                      />
                    </div>
                    <Input
                      label="Ownership form"
                      {...form.register('ownershipForm')}
                      error={form.formState.errors.ownershipForm?.message}
                    />
                    <Input
                      label="EDRPOU"
                      {...form.register('edrpou')}
                      error={form.formState.errors.edrpou?.message}
                    />
                    <Input
                      label="Contact first name"
                      {...form.register('firstName')}
                      error={form.formState.errors.firstName?.message}
                    />
                    <Input
                      label="Contact last name"
                      {...form.register('lastName')}
                      error={form.formState.errors.lastName?.message}
                    />
                    <Input
                      label="Contact patronymic"
                      {...form.register('patronymic')}
                      error={form.formState.errors.patronymic?.message}
                    />
                  </>
                )}

                <Input
                  label="Phone"
                  {...form.register('phone')}
                  error={form.formState.errors.phone?.message}
                />
                <Input
                  label="Email"
                  {...form.register('email')}
                  error={form.formState.errors.email?.message}
                />
              </section>

              <section className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Note
                  </label>
                  <textarea
                    {...form.register('note')}
                    rows={3}
                    placeholder="Optional delivery note"
                    className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Saved address
                  </label>
                  <select
                    {...form.register('addressType')}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">No saved address</option>
                    {ADDRESS_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {addressType ? (
                  <>
                    <Input
                      label="City"
                      {...form.register('city')}
                      error={form.formState.errors.city?.message}
                    />

                    {addressType === 'BRANCH' ? (
                      <Input
                        label="Branch number"
                        {...form.register('branchNumber')}
                        error={form.formState.errors.branchNumber?.message}
                      />
                    ) : (
                      <>
                        <Input
                          label="Street"
                          {...form.register('street')}
                          error={form.formState.errors.street?.message}
                        />
                        <Input
                          label="Building"
                          {...form.register('building')}
                          error={form.formState.errors.building?.message}
                        />
                        <Input
                          label="Flat"
                          {...form.register('flat')}
                          error={form.formState.errors.flat?.message}
                        />
                        <Input
                          label="Post code"
                          {...form.register('postCode')}
                          error={form.formState.errors.postCode?.message}
                        />
                      </>
                    )}
                  </>
                ) : null}
              </section>

              {apiError ? <p className="text-sm text-red-600">{apiError}</p> : null}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  color="neutral"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" color="green" disabled={isPending}>
                  {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create recipient'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
