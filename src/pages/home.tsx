import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'

const roleLabel: Record<string, string> = {
  CLIENT: 'Client',
  COURIER: 'Courier',
  OPERATOR: 'Operator',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
}

export default function HomePage() {
  const { user, logout } = useAuth()

  const identifier = user?.email ?? user?.phoneNumber ?? user?.phone ?? ''
  const role = user?.role ? (roleLabel[user.role] ?? user.role) : ''
  const type = user?.type === 'ORGANIZATION' ? 'Organization' : 'Individual'

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-green-700">SendIt</span>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{identifier}</p>
              <p className="text-xs text-neutral-500">{role} · {type}</p>
            </div>
            <Button color="green" onClick={logout} className="text-sm">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
          Welcome back
        </h1>
        <p className="mb-10 text-sm text-neutral-500">
          What would you like to do today?
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Send a parcel"
            description="Create a new shipment and get a delivery quote."
            icon="📦"
          />
          <ActionCard
            title="Track shipment"
            description="Check the real-time status of your packages."
            icon="📍"
          />
          <ActionCard
            title="My orders"
            description="View your full shipment history and invoices."
            icon="🗂️"
          />
        </div>
      </main>
    </div>
  )
}

function ActionCard({ title, description, icon }: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
      </div>
      <Button color="green" className="mt-auto w-full text-sm" disabled>
        Coming soon
      </Button>
    </div>
  )
}
