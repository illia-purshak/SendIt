import { useState } from "react";
import { Button } from "@/components/Button";

export default function AdminSettingsPage() {
  const [notifPrefs, setNotifPrefs] = useState({
    shipmentEmail: true,
    subscriptionEmail: true,
    newUserEmail: true,
    systemEmail: false,
  });

  function togglePref(key: keyof typeof notifPrefs) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Platform settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Configure system-wide parameters and notifications.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <Section title="Admin notifications">
          <p className="mb-4 text-xs text-neutral-400">Choose which events trigger email notifications to admins.</p>
          {[
            { label: "New user registration", key: "newUserEmail" as const },
            { label: "Subscription change", key: "subscriptionEmail" as const },
            { label: "Shipment status change", key: "shipmentEmail" as const },
            { label: "System alerts", key: "systemEmail" as const },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{row.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[row.key]}
                onChange={() => togglePref(row.key)}
                className="h-4 w-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
              />
            </div>
          ))}
        </Section>

        <Section title="System">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">Maintenance mode</p>
              <p className="text-xs text-neutral-400">Blocks client access with a maintenance banner.</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-green-600" />
          </div>
        </Section>

        <div>
          <Button color="green">Save settings</Button>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
