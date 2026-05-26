import { Link } from 'react-router-dom'
import { useAdminStatisticsQuery } from '@/api/admin-statistics'
import { useAdminTicketsQuery } from '@/api/admin-support'
import { APP_ROUTES } from '@/constants/app-routes'
import type { AdminPostalOperatorStatistics } from '@/types/admin-statistics'
import {
  getSupportStatusClass,
  getSupportStatusLabel,
  getTicketPreview,
} from '@/views/support/support-meta'

const SUMMARY_CARD_CONFIG = [
  { key: 'totalUsers', label: 'Total users', dot: 'from-indigo-400 to-indigo-600' },
  {
    key: 'activePaidSubscriptions',
    label: 'Active subscriptions',
    dot: 'from-green-400 to-green-600',
  },
  {
    key: 'totalConnectedPostalOperators',
    label: 'Operator connections',
    dot: 'from-sky-400 to-blue-500',
  },
  { key: 'openSupportTickets', label: 'Open tickets', dot: 'from-red-400 to-pink-500' },
] as const

const OPERATOR_CARD_CONFIG = [
  {
    code: 'nova_poshta',
    displayName: 'Nova Poshta',
    initials: 'NP',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
  },
  {
    code: 'ukrposhta',
    displayName: 'Ukrposhta',
    initials: 'UP',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
  },
  {
    code: 'meest',
    displayName: 'Meest',
    initials: 'ME',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
  },
] as const

type SummaryCardKey = typeof SUMMARY_CARD_CONFIG[number]['key']

function TopStatCard({
  label,
  value,
  dot,
}: {
  label: string
  value: number
  dot: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-sm text-neutral-400">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className={`h-7 w-7 shrink-0 rounded-full bg-gradient-to-br ${dot} shadow-sm`} />
        <span className="text-3xl font-bold tracking-tight text-neutral-900">
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function OperatorCard({
  operator,
  initials,
  iconBg,
  iconText,
}: {
  operator: AdminPostalOperatorStatistics
  initials: string
  iconBg: string
  iconText: string
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2 px-5 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${iconBg} ${iconText}`}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{operator.displayName}</p>
            <p className="text-xs text-neutral-400">{operator.code}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-neutral-400">Connected users</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">
            {operator.connectedUsers.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">User share</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-900">
            {operator.connectedUsersPercent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Response time</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-500">
            {operator.responseTimeMs === null ? 'N/A' : `${operator.responseTimeMs} ms`}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Health status</p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-500">
            {operator.status ?? 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function getTicketUserLabel(companyName: string | null, email: string) {
  return companyName?.trim() || email
}

function createFallbackOperator(
  code: string,
  displayName: string,
): AdminPostalOperatorStatistics {
  return {
    id: null,
    code,
    displayName,
    connectedUsers: 0,
    connectedUsersPercent: 0,
    responseTimeMs: null,
    status: null,
  }
}

export default function AdminDashboardPage() {
  const {
    data: statistics,
    isLoading: statisticsLoading,
    error: statisticsError,
  } = useAdminStatisticsQuery()
  const {
    data: recentTicketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useAdminTicketsQuery({ status: 'WAITING', page: 1, limit: 3 })

  const operatorLookup = new Map(
    (statistics?.postalOperators ?? []).map(operator => [operator.code, operator]),
  )

  const orderedOperators = OPERATOR_CARD_CONFIG.map(config => ({
    ...config,
    operator:
      operatorLookup.get(config.code) ??
      createFallbackOperator(config.code, config.displayName),
  }))

  const recentTickets = recentTicketsData?.items ?? []

  return (
    <div className="py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Admin dashboard</h1>
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          Live data
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SUMMARY_CARD_CONFIG.map(card => (
          <TopStatCard
            key={card.key}
            label={card.label}
            dot={card.dot}
            value={statistics?.summary[card.key as SummaryCardKey] ?? 0}
          />
        ))}
      </div>
      {statisticsLoading && <p className="-mt-6 mb-8 text-sm text-neutral-400">Loading summary...</p>}
      {statisticsError && (
        <p className="-mt-6 mb-8 text-sm text-red-500">Failed to load dashboard summary.</p>
      )}

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Operators</h2>
          <Link
            to={APP_ROUTES.admin.services}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            See All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {orderedOperators.map(({ code, operator, initials, iconBg, iconText }) => (
            <OperatorCard
              key={code}
              operator={operator}
              initials={initials}
              iconBg={iconBg}
              iconText={iconText}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Recent Support Tickets</h2>
          <Link
            to={APP_ROUTES.admin.support}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            See All
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Ticket
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Latest activity
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Preview
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {!ticketsLoading &&
                recentTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className={`${
                      index < recentTickets.length - 1 ? 'border-b border-neutral-50' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={APP_ROUTES.admin.support}
                        className="block hover:text-green-700"
                      >
                        <p className="font-medium text-neutral-900">{ticket.subject}</p>
                        <p className="text-xs text-neutral-400">
                          {getTicketUserLabel(ticket.user.profile.companyName, ticket.user.email)}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-neutral-500">
                      {formatDateTime(ticket.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-neutral-500">
                      {getTicketPreview(ticket) || 'No messages yet'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSupportStatusClass(ticket.status)}`}
                      >
                        {getSupportStatusLabel(ticket.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              {ticketsLoading && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-400">
                    Loading recent tickets...
                  </td>
                </tr>
              )}
              {!ticketsLoading && ticketsError && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-red-500">
                    Failed to load recent tickets.
                  </td>
                </tr>
              )}
              {!ticketsLoading && !ticketsError && recentTickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-400">
                    No open tickets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
