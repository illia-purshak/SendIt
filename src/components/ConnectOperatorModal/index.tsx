import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useToast } from '@/components/Toast/use-toast'
import {
  useRequestNovaPostKey,
  useConnectNovaPoshta,
  useUpdateNovaPoshtaKey,
  useConnectUkrposhta,
  useUpdateUkrposhtaKey,
  useConnectMeest,
  useUpdateMeestKey,
  PostalConnectionError,
  ConnectionNotFoundError,
  PostalOperatorLimitError,
} from '@/api/postal-connections'
import type { PostalConnection } from '@/types/postal-connections'
import { requestKeySchema, connectOperatorSchema } from '@/validation/postal-connections'
import type { z } from 'zod'

type PhoneFormValues = z.infer<typeof requestKeySchema>
type KeyFormValues = z.infer<typeof connectOperatorSchema>

type Operator = 'nova-poshta' | 'ukrposhta' | 'meest'

interface ConnectOperatorModalProps {
  open: boolean
  onClose: () => void
  operator: Operator
  operatorName: string
  existingConnection: PostalConnection | null
  onOperatorLimitReached?: () => void
}

export function ConnectOperatorModal({
  open,
  onClose,
  operator,
  operatorName,
  existingConnection,
  onOperatorLimitReached,
}: ConnectOperatorModalProps) {
  const { toast } = useToast()
  const isUpdate = Boolean(existingConnection)
  const [step, setStep] = useState<1 | 2>(operator === 'nova-poshta' ? 1 : 2)
  const [prefillApiKey, setPrefillApiKey] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const { mutateAsync: requestKey, isPending: requestKeyPending } = useRequestNovaPostKey()
  const { mutateAsync: connectNovaPoshta, isPending: connectNPPending } = useConnectNovaPoshta()
  const { mutateAsync: updateNovaPoshta, isPending: updateNPPending } = useUpdateNovaPoshtaKey()
  const { mutateAsync: connectUkrposhta, isPending: connectUkrPending } = useConnectUkrposhta()
  const { mutateAsync: updateUkrposhta, isPending: updateUkrPending } = useUpdateUkrposhtaKey()
  const { mutateAsync: connectMeest, isPending: connectMeestPending } = useConnectMeest()
  const { mutateAsync: updateMeest, isPending: updateMeestPending } = useUpdateMeestKey()

  const connectFn = operator === 'nova-poshta' ? connectNovaPoshta : operator === 'ukrposhta' ? connectUkrposhta : connectMeest
  const updateFn = operator === 'nova-poshta' ? updateNovaPoshta : operator === 'ukrposhta' ? updateUkrposhta : updateMeest
  const connectPending = operator === 'nova-poshta' ? connectNPPending : operator === 'ukrposhta' ? connectUkrPending : connectMeestPending
  const updatePending = operator === 'nova-poshta' ? updateNPPending : operator === 'ukrposhta' ? updateUkrPending : updateMeestPending

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(requestKeySchema),
    defaultValues: { phone: '' },
  })

  const keyForm = useForm<KeyFormValues>({
    resolver: zodResolver(connectOperatorSchema),
    defaultValues: { apiKey: '' },
  })

  function handleClose() {
    phoneForm.reset()
    keyForm.reset()
    setStep(operator === 'nova-poshta' ? 1 : 2)
    setPrefillApiKey('')
    setApiError(null)
    onClose()
  }

  function handleBack() {
    keyForm.reset()
    setApiError(null)
    setStep(1)
  }

  async function onPhoneSubmit(values: PhoneFormValues) {
    setApiError(null)
    try {
      const data = await requestKey({ phone: values.phone })
      keyForm.setValue('apiKey', data.apiKey)
      setPrefillApiKey(data.apiKey)
      setStep(2)
    } catch (err) {
      if (err instanceof PostalConnectionError) {
        setApiError(err.message)
      } else {
        setApiError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
  }

  async function onKeySubmit(values: KeyFormValues) {
    setApiError(null)
    try {
      if (isUpdate) {
        await updateFn({ apiKey: values.apiKey })
        toast({ title: 'API key updated', color: 'success' })
      } else {
        await connectFn({ apiKey: values.apiKey })
        toast({ title: `${operatorName} connected`, color: 'success' })
      }
      handleClose()
    } catch (err) {
      if (err instanceof PostalOperatorLimitError) {
        onOperatorLimitReached?.()
        handleClose()
      } else if (err instanceof ConnectionNotFoundError) {
        setApiError('No existing connection found - please reconnect')
      } else if (err instanceof PostalConnectionError) {
        if (err.status === 400) {
          setApiError(
            isUpdate
              ? 'The API key was rejected by the operator. Please check and try again.'
              : 'Invalid API key - please check and try again',
          )
        } else {
          setApiError(err.message)
        }
      } else {
        setApiError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
  }

  const title = isUpdate ? `Update ${operatorName} API key` : `Connect ${operatorName}`
  const isNovaPost = operator === 'nova-poshta'

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
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
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-white p-6 shadow-xl',
            'data-[state=open]:animate-[dialog-in_200ms_ease]',
            'data-[state=closed]:animate-[dialog-out_150ms_ease]',
          ].join(' ')}
        >
          <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
            {title}
          </Dialog.Title>

          {!isUpdate ? (
            <>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                {isNovaPost && step === 1
                  ? 'Enter your phone number registered with Nova Post to receive an API key.'
                  : 'Enter your API key to connect this operator.'}
              </Dialog.Description>

              {isNovaPost && step === 1 ? (
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="flex flex-col gap-4">
                  <Controller
                    control={phoneForm.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <Input
                        label="Phone number"
                        type="tel"
                        placeholder="380XXXXXXXXX"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        color="green"
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />

                  {apiError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" color="neutral" type="button" onClick={handleClose} disabled={requestKeyPending}>
                      Cancel
                    </Button>
                    <Button type="submit" color="green" disabled={phoneForm.formState.isSubmitting || requestKeyPending}>
                      {requestKeyPending ? 'Sending...' : 'Send key'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={keyForm.handleSubmit(onKeySubmit)} className="flex flex-col gap-4">
                  <Controller
                    control={keyForm.control}
                    name="apiKey"
                    render={({ field, fieldState }) => (
                      <Input
                        label="API key"
                        type="text"
                        placeholder={prefillApiKey || '****************'}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        color="green"
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />

                  {apiError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    {isNovaPost ? (
                      <Button variant="outline" color="neutral" type="button" onClick={handleBack} disabled={connectPending}>
                        Back
                      </Button>
                    ) : (
                      <Button variant="outline" color="neutral" type="button" onClick={handleClose} disabled={connectPending}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" color="green" disabled={keyForm.formState.isSubmitting || connectPending}>
                      {connectPending ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                Your API key is stored encrypted and never returned after saving.
              </Dialog.Description>

              <form onSubmit={keyForm.handleSubmit(onKeySubmit)} className="flex flex-col gap-4">
                <Controller
                  control={keyForm.control}
                  name="apiKey"
                  render={({ field, fieldState }) => (
                    <Input
                      label="API key"
                      type="password"
                      placeholder="****************"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      color="green"
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />

                {isNovaPost && (
                  <a
                    href="https://my.novaposhta.ua/settings/index#apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-green-700 hover:underline"
                  >
                    Where to find your API key →
                  </a>
                )}

                {apiError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" color="neutral" type="button" onClick={handleClose} disabled={updatePending}>
                    Cancel
                  </Button>
                  <Button type="submit" color="green" disabled={keyForm.formState.isSubmitting || updatePending}>
                    {updatePending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
