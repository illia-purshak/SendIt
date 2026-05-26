import { Button } from "@/components/Button";

type AdminRole = "ADMIN" | "SUPER_ADMIN";

const ADMIN: { firstName: string; lastName: string; email: string; role: AdminRole; status: string; twoFactorEnabled: boolean } = {
  firstName: "Олена",
  lastName: "Сидоренко",
  email: "elena.sydorenko@sendit.ua",
  role: "ADMIN",
  status: "ACTIVE",
  twoFactorEnabled: true,
};

export default function AdminProfilePage() {
  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">My profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your admin account details and security.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <Section title="Profile">
          <Row label="Name" value={`${ADMIN.firstName} ${ADMIN.lastName}`} />
          <Row label="Email" value={ADMIN.email} />
          <Row label="Role">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              ADMIN.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
            }`}>
              {ADMIN.role}
            </span>
          </Row>
          <Row label="Status">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {ADMIN.status}
            </span>
          </Row>
        </Section>

        <Section title="Change password">
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current password"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
            <input
              type="password"
              placeholder="New password"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
            <Button color="green" className="self-start">Update password</Button>
          </div>
        </Section>

        <Section title="Two-factor authentication">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">TOTP authenticator</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {ADMIN.role === "ADMIN" ? "Required for ADMIN role." : "Optional for SUPER_ADMIN."}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              ADMIN.twoFactorEnabled ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"
            }`}>
              {ADMIN.twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {!ADMIN.twoFactorEnabled && (
            <Button color="green" className="self-start text-sm">Set up 2FA</Button>
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-neutral-500">{label}</span>
      {value ? <span className="text-sm text-neutral-900">{value}</span> : children}
    </div>
  );
}
