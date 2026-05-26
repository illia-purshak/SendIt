import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useCreateTemplateMutation } from '@/api/templates'
import { usePostalConnectionsQuery } from '@/api/postal-connections'
import { useToast } from '@/components/Toast/use-toast'
import type { ShipmentType } from '@/types/template'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

type ModalValues = z.infer<typeof schema>

interface SaveAsTemplateModalProps {
  open: boolean
  onClose: () => void
  cargoCategory: string
  templateData: Record<string, unknown>
}

function shipmentTypeFromCargoCategory(cargoCategory: string): ShipmentType {
  if (cargoCategory === 'CARGO') return 'CARGO'
  if (cargoCategory === 'DOCUMENTS') return 'DOCUMENT'
  if (cargoCategory === 'TIR_TRUCKS') return 'PALLET'
  return 'UNKNOWN'
}

export function SaveAsTemplateModal({ open, onClose, cargoCategory, templateData }: SaveAsTemplateModalProps) {
  const { toast } = useToast()
  const [apiError, setApiError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useCreateTemplateMutation()
  const { data: connectionsData } = usePostalConnectionsQuery()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModalValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name: `Nova Poshta — ${new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())}`,
      description: '',
    })
  }, [open, reset])

  function handleClose() {
    onClose()
    setApiError(null)
  }

  async function onSave(values: ModalValues) {
    setApiError(null)
    const postalServiceId = connectionsData?.connections[0]?.postalService.id ?? 0
    try {
      await mutateAsync({
        name: values.name,
        description: values.description || undefined,
        postalServiceId,
        shipmentType: shipmentTypeFromCargoCategory(cargoCategory),
        templateData,
      })
      toast({ title: 'Template saved', color: 'success' })
      handleClose()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
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
            Save as template
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-sm text-neutral-500">
            Name this template to reuse it for future shipments.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Name</label>
              <Input
                {...register('name')}
                placeholder="Nova Poshta — 17 May 2026"
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Description <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="e.g. Standard parcel for domestic delivery"
                className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {apiError && <p className="text-sm text-red-600">{apiError}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" color="neutral" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" color="green" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save template'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
