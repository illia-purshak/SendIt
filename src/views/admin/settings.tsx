import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminProfileQuery, useAdminUpdateSettingsMutation } from "@/api/admin-profile";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select/Select";
import { syncLanguage } from "@/i18n/utils";

const TIMEZONE_OPTIONS = [
  { value: "Europe/Kyiv", label: "Kyiv (UTC+2/+3)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Europe/London", label: "London (UTC+0/+1)" },
  { value: "UTC", label: "UTC" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminProfileQuery();
  const { mutateAsync: updateSettings, isPending } = useAdminUpdateSettingsMutation();
  const [notifPrefs, setNotifPrefs] = useState({
    shipmentEmail: true,
    subscriptionEmail: true,
    newUserEmail: true,
    systemEmail: false,
  });
  const [language, setLanguage] = useState(data?.settings.language ?? "en");
  const [timezone, setTimezone] = useState(data?.settings.timezone ?? "Europe/Kyiv");
  const [dateFormat, setDateFormat] = useState(data?.settings.dateFormat ?? "DD.MM.YYYY");

  useEffect(() => {
    if (!data?.settings) return;
    setLanguage(data.settings.language ?? "en");
    setTimezone(data.settings.timezone ?? "Europe/Kyiv");
    setDateFormat(data.settings.dateFormat ?? "DD.MM.YYYY");
  }, [data?.settings]);

  function togglePref(key: keyof typeof notifPrefs) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    await updateSettings({ language, timezone, dateFormat });
    syncLanguage(language);
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">{t("adminSettings.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("adminSettings.description")}</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <Section title={t("profile.preferences")}>
          <Select
            label={t("common.language")}
            options={[
              { value: "en", label: t("common.english") },
              { value: "uk", label: t("common.ukrainian") },
            ]}
            value={language}
            onValueChange={setLanguage}
            color="teal"
          />
          <Select
            label={t("common.timezone")}
            options={TIMEZONE_OPTIONS}
            value={timezone}
            onValueChange={setTimezone}
            color="teal"
          />
          <Select
            label={t("common.dateFormat")}
            options={DATE_FORMAT_OPTIONS}
            value={dateFormat}
            onValueChange={setDateFormat}
            color="teal"
          />
        </Section>

        <Section title={t("adminSettings.adminNotifications")}>
          <p className="mb-4 text-xs text-neutral-400">{t("adminSettings.adminNotificationsDescription")}</p>
          {[
            { label: t("adminSettings.newUserRegistration"), key: "newUserEmail" as const },
            { label: t("adminSettings.subscriptionChange"), key: "subscriptionEmail" as const },
            { label: t("adminSettings.shipmentStatusChange"), key: "shipmentEmail" as const },
            { label: t("adminSettings.systemAlerts"), key: "systemEmail" as const },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">{row.label}</span>
              <input
                type="checkbox"
                checked={notifPrefs[row.key]}
                onChange={() => togglePref(row.key)}
                className="h-4 w-4 rounded border-neutral-300 text-teal-600 focus:ring-teal-500"
              />
            </div>
          ))}
        </Section>

        <Section title={t("adminSettings.system")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">{t("adminSettings.maintenanceMode")}</p>
              <p className="text-xs text-neutral-400">{t("adminSettings.maintenanceModeDescription")}</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-teal-600" />
          </div>
        </Section>

        <div>
          <Button color="teal" disabled={isPending || isLoading} onClick={handleSave}>
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
