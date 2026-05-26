import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/Button'

interface CancelGuardModalProps {
  open: boolean
  onClose: () => void
  onDiscard: () => void
  onSaveDraft: () => Promise<void>
  isSavingDraft: boolean
}

export function CancelGuardModal({
  open,
  onClose,
  onDiscard,
  onSaveDraft,
  isSavingDraft,
}: CancelGuardModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
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
            'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-white p-6 shadow-xl',
            'data-[state=open]:animate-[dialog-in_200ms_ease]',
            'data-[state=closed]:animate-[dialog-out_150ms_ease]',
          ].join(' ')}
        >
          <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
            Leave page?
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-sm text-neutral-500">
            You have unsaved changes. What would you like to do?
          </Dialog.Description>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              color="neutral"
              variant="outline"
              className="w-full"
              disabled={isSavingDraft}
              onClick={onClose}
            >
              Continue editing
            </Button>
            <Button
              type="button"
              color="error"
              variant="outline"
              className="w-full"
              disabled={isSavingDraft}
              onClick={onDiscard}
            >
              Discard changes
            </Button>
            <Button
              type="button"
              color="green"
              className="w-full"
              disabled={isSavingDraft}
              onClick={onSaveDraft}
            >
              {isSavingDraft ? 'Saving…' : 'Save as draft'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
