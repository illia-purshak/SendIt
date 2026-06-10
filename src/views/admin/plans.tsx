import { useState } from 'react'
import {
  useAdminPlansQuery,
  useAdminCreatePlanMutation,
  useAdminUpdatePlanMutation,
  useAdminDeletePlanMutation,
  SubscriptionError,
  type AdminPlanBody,
} from '@/api/subscriptions'
import { useToast } from '@/components/Toast/use-toast'
import { Button } from '@/components/Button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/AlertDialog'
import type { SubscriptionPlan } from '@/types/subscription'

// ─── Plan form dialog ─────────────────────────────────────────────────────────

interface PlanFormDialogProps {
  plan?: SubscriptionPlan
  open: boolean
  onClose: () => void
}

const EMPTY_FORM: AdminPlanBody = {
  name: '',
  level: 1,
  price: '',
  priceYearly: null,
  maxOperators: 999,
  hasAnalytics: false,
  hasTemplates: false,
  hasRecipients: false,
  hasSupport: true,
  autoRenewDefault: true,
  isPublic: true,
  isPersonal: false,
  targetUserId: null,
}

function PlanFormDialog({ plan, open, onClose }: PlanFormDialogProps) {
  const [form, setForm] = useState<AdminPlanBody>(
    plan
      ? {
          name: plan.name,
          level: plan.level,
          price: String(plan.price),
          priceYearly: plan.priceYearly != null ? String(plan.priceYearly) : null,
          maxOperators: plan.maxOperators,
          hasAnalytics: plan.hasAnalytics,
          hasTemplates: plan.hasTemplates,
          hasRecipients: plan.hasRecipients,
          hasSupport: plan.hasSupport,
          autoRenewDefault: plan.autoRenewDefault,
          isPublic: plan.isPublic,
          isPersonal: plan.isPersonal,
          targetUserId: null,
        }
      : EMPTY_FORM,
  )

  const { mutateAsync: create, isPending: creating } = useAdminCreatePlanMutation()
  const { mutateAsync: update, isPending: updating } = useAdminUpdatePlanMutation()
  const { toast } = useToast()

  const isPending = creating || updating

  function set<K extends keyof AdminPlanBody>(key: K, value: AdminPlanBody[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.name || !form.price) {
      toast({ title: 'Name and price are required', color: 'warning' })
      return
    }
    try {
      if (plan) {
        await update({ id: plan.id, ...form })
        toast({ title: 'Plan updated', color: 'success' })
      } else {
        await create(form)
        toast({ title: 'Plan created', color: 'success' })
      }
      onClose()
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : 'Something went wrong'
      toast({ title: 'Error', description: msg, color: 'error' })
    }
  }

  return (
    <AlertDialog open={open} color="teal">
      <AlertDialogContent className="max-w-lg">
        <AlertDialogTitle>{plan ? 'Edit plan' : 'New plan'}</AlertDialogTitle>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-500">Name</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Pro"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Level</label>
            <input
              type="number"
              min={0}
              value={form.level}
              onChange={e => set('level', Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Max operators</label>
            <input
              type="number"
              min={1}
              value={form.maxOperators}
              onChange={e => set('maxOperators', Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Price/mo (₴)</label>
            <input
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Price/yr (₴, optional)</label>
            <input
              value={form.priceYearly ?? ''}
              onChange={e => set('priceYearly', e.target.value || null)}
              placeholder="0.00"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-2 block text-xs font-medium text-neutral-500">Features</label>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['hasAnalytics', 'Analytics'],
                  ['hasTemplates', 'Templates'],
                  ['hasRecipients', 'Recipients'],
                  ['hasSupport', 'Support'],
                ] as [keyof AdminPlanBody, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={e => set(key, e.target.checked as AdminPlanBody[typeof key])}
                    className="accent-teal-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex flex-wrap gap-4">
            {(
              [
                ['autoRenewDefault', 'Auto-renew default'],
                ['isPublic', 'Public'],
                ['isPersonal', 'Personal'],
              ] as [keyof AdminPlanBody, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form[key]}
                  onChange={e => set(key, e.target.checked as AdminPlanBody[typeof key])}
                  className="accent-teal-600"
                />
                {label}
              </label>
            ))}
          </div>

          {form.isPersonal && (
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-500">Target user ID</label>
              <input
                type="number"
                min={1}
                value={form.targetUserId ?? ''}
                onChange={e => set('targetUserId', e.target.value ? Number(e.target.value) : null)}
                placeholder="User ID"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : plan ? 'Save changes' : 'Create plan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

interface DeletePlanDialogProps {
  plan: SubscriptionPlan
  open: boolean
  onClose: () => void
}

function DeletePlanDialog({ plan, open, onClose }: DeletePlanDialogProps) {
  const { mutateAsync, isPending } = useAdminDeletePlanMutation()
  const { toast } = useToast()

  async function handleConfirm() {
    try {
      await mutateAsync(plan.id)
      toast({ title: `Plan "${plan.name}" deleted`, color: 'success' })
      onClose()
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : 'Something went wrong'
      toast({ title: 'Error', description: msg, color: 'error' })
    }
  }

  return (
    <AlertDialog open={open} color="error">
      <AlertDialogContent>
        <AlertDialogTitle>Delete plan</AlertDialogTitle>
        <AlertDialogDescription>
          Delete "{plan.name}"? This will fail if there are active subscriptions on this plan.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Feature badge ────────────────────────────────────────────────────────────

function FeatureBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        active ? 'bg-teal-100 text-teal-700' : 'bg-neutral-100 text-neutral-400',
      ].join(' ')}
    >
      {label}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const [filter, setFilter] = useState<'all' | 'public' | 'personal'>('all')
  const [page, setPage] = useState(1)
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null)
  const [deletePlan, setDeletePlan] = useState<SubscriptionPlan | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const params =
    filter === 'public'
      ? { isPublic: true }
      : filter === 'personal'
        ? { isPersonal: true }
        : {}

  const { data, isLoading, isError } = useAdminPlansQuery({ ...params, page, limit: 20 })

  const plans = data?.items ?? []
  const meta = data?.meta
  const totalPages = meta?.totalPages ?? 0

  return (
    <main className="py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Plans</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage subscription plan catalog.</p>
        </div>
        <Button color="teal" size="sm" onClick={() => setShowCreate(true)}>
          New plan
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'public', 'personal'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setPage(1) }}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              filter === f
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            ].join(' ')}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load plans.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Name</Th>
              <Th>Level</Th>
              <Th>Price/mo</Th>
              <Th>Price/yr</Th>
              <Th>Features</Th>
              <Th>Type</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && plans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">
                  No plans found.
                </td>
              </tr>
            )}

            {!isLoading &&
              plans.map(plan => (
                <tr key={plan.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{plan.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{plan.level}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {Number(plan.price) === 0 ? 'Free' : `₴${plan.price}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {plan.priceYearly ? `₴${plan.priceYearly}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <FeatureBadge label="Analytics" active={plan.hasAnalytics} />
                      <FeatureBadge label="Templates" active={plan.hasTemplates} />
                      <FeatureBadge label="Recipients" active={plan.hasRecipients} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {plan.isPersonal ? 'Personal' : 'Public'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        color="neutral"
                        onClick={() => setEditPlan(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="error"
                        onClick={() => setDeletePlan(plan)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!meta?.hasPreviousPage}
            onClick={() => setPage(p => p - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {meta?.page ?? page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!meta?.hasNextPage}
            onClick={() => setPage(p => p + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      )}

      {showCreate && (
        <PlanFormDialog open onClose={() => setShowCreate(false)} />
      )}
      {editPlan && (
        <PlanFormDialog plan={editPlan} open onClose={() => setEditPlan(null)} />
      )}
      {deletePlan && (
        <DeletePlanDialog plan={deletePlan} open onClose={() => setDeletePlan(null)} />
      )}
    </main>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </th>
  )
}
