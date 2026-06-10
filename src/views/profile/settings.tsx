import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { useProfileQuery, useUpdateSettingsMutation } from "@/api/auth";
import { useToast } from "@/components/Toast/use-toast";
import { ApiValidationError } from "@/utils/parseApiError";
import { syncLanguage } from "@/i18n/utils";

type NotifKey = "subscription" | "postalConnection" | "system" | "email";

interface Overrides {
  language?: string;
  timezone?: string;
  notifications?: Partial<Record<NotifKey, boolean>>;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: profile } = useProfileQuery();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettingsMutation();
  const { toast } = useToast();

  const [overrides, setOverrides] = useState<Overrides>({});

  const language = overrides.language ?? profile?.settings?.language ?? "en";
  const timezone = overrides.timezone ?? profile?.settings?.timezone ?? "Europe/Kyiv";
  const notifPrefs = {
    subscription: overrides.notifications?.subscription ?? profile?.notifications?.subscription ?? true,
    postalConnection: overrides.notifications?.postalConnection ?? profile?.notifications?.postalConnection ?? true,
    system: overrides.notifications?.system ?? profile?.notifications?.system ?? true,
    email: overrides.notifications?.email ?? profile?.notifications?.email ?? false,
  };

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
      syncLanguage(language);
      toast({ title: t("profile.settingsSaved"), color: "success" });
    } catch (err) {
      if (err instanceof ApiValidationError && err.validationDetails.length > 0) {
        toast({ title: err.message, description: err.validationDetails.join('\n'), color: "error" });
      } else {
        toast({
          title: t("settingsPage.saveFailed"),
          description: err instanceof Error ? err.message : t("settingsPage.tryAgain"),
          color: "error",
        });
      }
    }
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">{t("settingsPage.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("settingsPage.description")}</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">
        <Section title={t("settingsPage.interface")}>
          <Field label={t("common.language")}>
            <select
              value={language}
              onChange={(e) => setOverrides((o) => ({ ...o, language: e.target.value }))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="uk">{t("common.ukrainian")}</option>
              <option value="en">{t("common.english")}</option>
            </select>
          </Field>
          <Field label={t("common.timezone")}>
            <select
              value={timezone}
              onChange={(e) => setOverrides((o) => ({ ...o, timezone: e.target.value }))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="Europe/Kyiv">Europe/Kyiv (UTC+3)</option>
              <option value="Europe/London">Europe/London (UTC+1)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </Section>

        <Section title={t("settingsPage.notifications")}>
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">{t("settingsPage.type")}</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">{t("settingsPage.enabled")}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "subscription" as const, label: t("profile.subscriptionUpdates") },
                  { key: "postalConnection" as const, label: t("profile.postalConnectionAlerts") },
                  { key: "system" as const, label: t("profile.systemNotifications") },
                  { key: "email" as const, label: t("profile.emailNotifications") },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-neutral-700">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[row.key]}
                        onChange={() => togglePref(row.key)}
                        className="h-4 w-4 rounded border-neutral-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-neutral-100 last:border-0 opacity-50">
                  <td className="px-4 py-3 text-neutral-700">{t("settingsPage.accountNotifications")}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="h-4 w-4 rounded border-neutral-300 text-teal-600"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <div>
          <Button color="teal" onClick={handleSave} disabled={isPending}>
            {isPending ? t("common.saving") : t("common.saveSettings")}
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
