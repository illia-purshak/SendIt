import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Link2,
  Package,
  Trash2,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Spinner } from '@/components/Loader/Spinner'
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useDeleteReadNotificationsMutation,
  useDeleteAllNotificationsMutation,
} from '@/api/notifications'
import type { NotificationType } from '@/types/notification'

const TYPE_META: Record<NotificationType, { icon: LucideIcon; iconBg: string; iconColor: string }> = {
  SHIPMENT_STATUS: { icon: Package, iconBg: 'bg-green-100', iconColor: 'text-green-700' },
  SUBSCRIPTION: { icon: CreditCard, iconBg: 'bg-info-100', iconColor: 'text-info-600' },
  SYSTEM: { icon: Bell, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-500' },
  POSTAL_CONNECTION: { icon: Link2, iconBg: 'bg-warning-100', iconColor: 'text-warning-500' },
  ACCOUNT: { icon: User, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-500' },
}

const TYPE_LABELS: Record<NotificationType, string> = {
  SUBSCRIPTION: 'Subscription',
  POSTAL_CONNECTION: 'Postal Connection',
  ACCOUNT: 'Account',
  SYSTEM: 'System',
  SHIPMENT_STATUS: 'Shipment Status',
}

const TYPE_OPTIONS: { value: NotificationType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'POSTAL_CONNECTION', label: 'Postal Connection' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'SHIPMENT_STATUS', label: 'Shipment Status' },
]

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Tab = 'all' | 'unread'

export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const tab = (searchParams.get('tab') as Tab) || 'all'
  const typeParam = (searchParams.get('type') as NotificationType) || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  function setTab(next: Tab) {
    setSearchParams((p) => { p.set('tab', next); p.delete('page'); return p })
    setConfirmDeleteAll(false)
  }

  function setTypeFilter(next: NotificationType | '') {
    setSearchParams((p) => {
      if (next) p.set('type', next); else p.delete('type')
      p.delete('page')
      return p
    })
    setConfirmDeleteAll(false)
  }

  function setPage(next: number) {
    setSearchParams((p) => {
      if (next === 1) p.delete('page'); else p.set('page', String(next))
      return p
    })
  }

  const { data, isLoading, error } = useNotificationsQuery(tab, typeParam || undefined, page)
  const { data: unreadData } = useUnreadCountQuery()
  const markRead = useMarkReadMutation()
  const markAllRead = useMarkAllReadMutation()
  const deleteOne = useDeleteNotificationMutation()
  const deleteRead = useDeleteReadNotificationsMutation()
  const deleteAll = useDeleteAllNotificationsMutation()

  const notifications = data?.items ?? []
  const meta = data?.meta
  const totalPages = meta?.totalPages ?? 1
  const unreadCount = unreadData?.count ?? 0

  useEffect(() => {
    if (!isLoading && notifications.length === 0 && page > 1) {
      setPage(1)
    }
  }, [isLoading, notifications.length, page])

  const anyMutating =
    markRead.isPending ||
    markAllRead.isPending ||
    deleteOne.isPending ||
    deleteRead.isPending ||
    deleteAll.isPending

  return (
    <main className="py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-neutral-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-xs font-semibold leading-none text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-400">Stay up to date on your shipments and account.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Confirm-delete-all flow */}
            {confirmDeleteAll ? (
              <>
                <span className="text-sm text-neutral-500">Delete all notifications?</span>
                <button
                  onClick={() => { deleteAll.mutate(); setConfirmDeleteAll(false) }}
                  disabled={anyMutating}
                  className="h-8 rounded-lg border border-error-300 bg-error-50 px-3 text-sm font-medium text-error-700 transition-colors hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(false)}
                  className="h-8 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={anyMutating || unreadCount === 0}
                  className="h-8 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => deleteRead.mutate()}
                  disabled={anyMutating}
                  className="h-8 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete read
                </button>
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  disabled={anyMutating}
                  className="h-8 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-600 transition-colors hover:border-error-200 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete all
                </button>
              </>
            )}

            {/* Type filter */}
            <select
              value={typeParam}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | '')}
              className="h-8 rounded-lg border border-neutral-300 bg-white pl-3 pr-7 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-700/20"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Tab switcher */}
            <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
              {(['all', 'unread'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    tab === t
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 h-px bg-neutral-200" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-xl border border-error-100 bg-error-100 px-6 py-10 text-center">
          <p className="text-sm text-error-600">Failed to load notifications.</p>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && (
        <>
          <div className="flex flex-col gap-2">
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <Bell size={20} />
                </span>
                <p className="text-sm font-medium text-neutral-600">
                  {tab === 'unread'
                    ? 'All caught up'
                    : typeParam
                      ? `No ${TYPE_LABELS[typeParam as NotificationType]} notifications`
                      : 'No notifications yet'}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {tab === 'unread'
                    ? 'You have no unread notifications.'
                    : 'Notifications will appear here when you have updates.'}
                </p>
              </div>
            )}

            {notifications.map((n, index) => {
              const { icon: Icon, iconBg, iconColor } = TYPE_META[n.type]

              return (
                <div key={n.id} className="animate-fade-up" style={{ animationDelay: `${index * 35}ms` }}>
                  <div
                    className={`group relative flex items-start gap-4 rounded-xl border bg-white p-5 transition-all duration-150 hover:shadow-md ${
                      n.isRead ? 'border-neutral-200' : 'border-neutral-200 border-l-2 border-l-green-700'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
                      <Icon size={16} aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm font-semibold ${n.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-700" />}
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-500">{n.body}</p>
                      <p className="mt-1.5 text-xs text-neutral-400">{formatTime(n.createdAt)}</p>
                    </div>

                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                          aria-label="Mark as read"
                          title="Mark as read"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-green-100 hover:text-green-700 disabled:opacity-50"
                        >
                          <Check size={15} strokeWidth={2.5} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteOne.mutate(n.id)}
                        disabled={deleteOne.isPending}
                        aria-label="Delete notification"
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-error-100 hover:text-error-600 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
