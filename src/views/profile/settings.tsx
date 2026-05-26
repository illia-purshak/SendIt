import { useState } from "react";
import { Button } from "@/components/Button";
import { useProfileQuery, useUpdateSettingsMutation } from "@/api/auth";
import { useToast } from "@/components/Toast/use-toast";

type NotifKey = 'subscription' | 'postalConnection' | 'system' | 'email'

interface Overrides {
  language?: string
  timezone?: string
  notifications?: Partial<Record<NotifKey, boolean>>
}

export default function SettingsPage() {
  const { data: profile } = useProfileQuery();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettingsMutation();
  const { toast } = useToast();

  const [overrides, setOverrides] = useState<Overrides>({});

  const language = overrides.language ?? profile?.settings?.language ?? "uk"
  const timezone = overrides.timezone ?? profile?.settings?.timezone ?? "Europe/Kyiv"
  const notifPrefs = {
    subscription: overrides.notifications?.subscription ?? profile?.notifications?.subscription ?? true,
    postalConnection: overrides.notifications?.postalConnection ?? profile?.notifications?.postalConnection ?? true,
    system: overrides.notifications?.system ?? profile?.notifications?.system ?? true,
    email: overrides.notifications?.email ?? profile?.notifications?.email ?? false,
  }

  function togglePref(key: NotifKey) {
    setOverrides((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !notifPrefs[key] },
    }));
  }

  async function handleSave() {
    try {
      await updateSettings({
        language,
        timezone,
        notifications: notifPrefs,
      });
      toast({ title: "Settings saved", color: "success" });
    } catch (err) {
      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Please try again.",
        color: "error",
      });
    }
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your interface and notification preferences.</p>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        <Section title="Interface">
          <Field label="Language">
            <select
              value={language}
              onChange={(e) => setOverrides((o) => ({ ...o, language: e.target.value }))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setOverrides((o) => ({ ...o, timezone: e.target.value }))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="Europe/Kyiv">Europe/Kyiv (UTC+3)</option>
              <option value="Europe/London">Europe/London (UTC+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </Section>

        <Section title="Notifications">
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Type</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { key: "subscription" as const, label: "Subscription updates" },
                    { key: "postalConnection" as const, label: "Postal connection alerts" },
                    { key: "system" as const, label: "System notifications" },
                    { key: "email" as const, label: "Email notifications" },
                  ]
                ).map((row) => (
                  <tr key={row.key} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-700">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[row.key]}
                        onChange={() => togglePref(row.key)}
                        className="h-4 w-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-neutral-100 last:border-0 opacity-50">
                  <td className="px-4 py-3 text-neutral-700">Account notifications</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="h-4 w-4 rounded border-neutral-300 text-green-600"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <div>
          <Button color="green" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save settings"}
          </Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </div>
  );
}
