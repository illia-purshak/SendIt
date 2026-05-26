import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";

const USER = {
  id: 1,
  company: "ТОВ «АльфаТрейд»",
  edrpou: "12345678",
  taxNumber: "1234567890",
  legalAddress: "м. Київ, вул. Хрещатик, 1",
  contactPerson: "Олексій Іваненко",
  email: "alpha@trade.ua",
  phone: "+380501112233",
  status: "ACTIVE" as const,
  registeredAt: "2026-01-15",
  subscription: { plan: "PRO", status: "ACTIVE", periodStart: "2026-05-01", periodEnd: "2026-05-31" },
  operators: [
    { name: "Нова Пошта", connectedAt: "2026-01-20", isActive: true },
    { name: "Укрпошта", connectedAt: "2026-03-10", isActive: true },
  ],
};

export default function AdminUserDetailPage() {
  const navigate = useNavigate();

  return (
    <main className="py-10">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" color="neutral" size="sm" onClick={() => navigate(APP_ROUTES.admin.users)}>
          ← Back
        </Button>
        <h1 className="text-xl font-semibold text-neutral-900">{USER.company}</h1>
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          {USER.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <InfoCard title="Organization">
            <Row label="Company" value={USER.company} />
            <Row label="EDRPOU" value={USER.edrpou} />
            <Row label="Tax number" value={USER.taxNumber} />
            <Row label="Legal address" value={USER.legalAddress} />
            <Row label="Contact person" value={USER.contactPerson} />
            <Row label="Email" value={USER.email} />
            <Row label="Phone" value={USER.phone} />
            <Row label="Registered" value={USER.registeredAt} />
          </InfoCard>

          <InfoCard title="Connected operators">
            {USER.operators.map((op) => (
              <div key={op.name} className="flex items-center justify-between">
                <span className="text-sm text-neutral-900">{op.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">{op.connectedAt}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    op.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {op.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </InfoCard>
        </div>

        <div className="flex flex-col gap-4">
          <InfoCard title="Subscription">
            <Row label="Plan" value={USER.subscription.plan} />
            <Row label="Status" value={USER.subscription.status} />
            <Row label="Period" value={`${USER.subscription.periodStart} — ${USER.subscription.periodEnd}`} />
          </InfoCard>

          <InfoCard title="Account actions">
            <div className="flex flex-col gap-2">
              <Button color="green" className="w-full text-sm">Set active</Button>
              <Button variant="outline" color="error" className="w-full text-sm">Block</Button>
              <Button variant="outline" color="neutral" className="w-full text-sm">Temp block</Button>
            </div>
          </InfoCard>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-900">{value}</span>
    </div>
  );
}
