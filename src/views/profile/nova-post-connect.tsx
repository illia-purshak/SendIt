import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { APP_ROUTES } from '@/constants/app-routes'
import { ApiError, OperatorLimitError, useConnectNovaPostMutation } from '@/api/nova-post'
import { sandboxConnectSchema, productionConnectSchema } from '@/validation/nova-post'
import { useToast } from '@/components/Toast/use-toast'
import type { z } from 'zod'

type SandboxValues = z.infer<typeof sandboxConnectSchema>
type ProductionValues = z.infer<typeof productionConnectSchema>
type Mode = 'sandbox' | 'production'

interface FormProps {
  onError: (err: string | null) => void
  onSuccess: () => void
}

function SandboxForm({ onError, onSuccess }: FormProps) {
  const { mutateAsync } = useConnectNovaPostMutation()
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SandboxValues>({
    resolver: zodResolver(sandboxConnectSchema),
    defaultValues: { phone: '' },
  })

  async function onSubmit(values: SandboxValues) {
    onError(null)
    try {
      await mutateAsync({ phone: values.phone })
      onSuccess()
    } catch (err) {
      if (err instanceof OperatorLimitError) {
        onError('Operator limit reached — upgrade your plan to connect more operators')
      } else if (err instanceof ApiError) {
        if (err.status === 404) onError('Phone number not registered with Nova Post')
        else if (err.status === 429) onError('Daily request limit exceeded — try again tomorrow')
        else onError(err.message)
      } else {
        onError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <Input
            label="Phone number"
            placeholder="49123456789"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            color="teal"
            error={fieldState.error?.message}
            required
          />
        )}
      />
      <p className="text-xs text-neutral-500">
        Enter the phone number registered at my.novapost.com (non-UA format, e.g. 49XXXXXXXXX).
      </p>
      <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Connecting…' : 'Connect'}
      </Button>
    </form>
  )
}

function ProductionForm({ onError, onSuccess }: FormProps) {
  const { mutateAsync } = useConnectNovaPostMutation()
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ProductionValues>({
    resolver: zodResolver(productionConnectSchema),
    defaultValues: { apiKey: '' },
  })

  async function onSubmit(values: ProductionValues) {
    onError(null)
    try {
      await mutateAsync({ apiKey: values.apiKey })
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) onError('Invalid API key')
        else if (err.status === 429) onError('Daily request limit exceeded — try again tomorrow')
        else onError(err.message)
      } else {
        onError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Controller
        control={control}
        name="apiKey"
        render={({ field, fieldState }) => (
          <Input
            label="API key"
            placeholder="your-nova-post-api-key"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            color="teal"
            error={fieldState.error?.message}
            required
          />
        )}
      />
      <p className="text-xs text-neutral-500">
        Provide the API key issued by your Nova Post manager.
      </p>
      <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Connecting…' : 'Connect'}
      </Button>
    </form>
  )
}

export default function NovaPostConnectPage() {
  const [mode, setMode] = useState<Mode>('sandbox')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setError(null)
  }

  function handleSuccess() {
    toast({ title: 'Nova Post connected', color: 'success' })
    navigate(APP_ROUTES.dashboard)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Connect Nova Post</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Link your Nova Post account to start shipping.
        </p>

        <div className="mb-6 flex rounded-lg border border-neutral-200 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('sandbox')}
            className={
              mode === 'sandbox'
                ? 'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors bg-teal-600 text-white'
                : 'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-neutral-500 hover:text-neutral-700'
            }
          >
            Sandbox
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('production')}
            className={
              mode === 'production'
                ? 'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors bg-teal-600 text-white'
                : 'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-neutral-500 hover:text-neutral-700'
            }
          >
            Production
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {mode === 'sandbox' ? (
          <SandboxForm onError={setError} onSuccess={handleSuccess} />
        ) : (
          <ProductionForm onError={setError} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  )
}
