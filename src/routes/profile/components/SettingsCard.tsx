import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateSettingsMutation } from "@/api/auth";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select/Select";
import { Switch } from "@/components/Switch";
import { useToast } from "@/components/Toast/use-toast";
import { syncLanguage } from "@/i18n/utils";
import { useProfileRouteData } from "../useProfileRouteData";

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

export function SettingsCard() {
  const { data, isLoading } = useProfileRouteData();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-28 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 flex flex-col gap-3">
          <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }

  return (
    <SettingsForm
      key={JSON.stringify({
        settings: data?.settings ?? null,
        notifications: data?.notifications ?? null,
      })}
      initialLanguage={data?.settings?.language ?? "en"}
      initialTimezone={data?.settings?.timezone ?? "Europe/Kyiv"}
      initialDateFormat={data?.settings?.dateFormat ?? "DD.MM.YYYY"}
      initialNotifications={{
        subscription: data?.notifications?.subscription ?? true,
        postalConnection: data?.notifications?.postalConnection ?? true,
        system: data?.notifications?.system ?? true,
        email: data?.notifications?.email ?? false,
      }}
    />
  );
}

function SettingsForm({
  initialLanguage,
  initialTimezone,
  initialDateFormat,
  initialNotifications,
}: {
  initialLanguage: string;
  initialTimezone: string;
  initialDateFormat: string;
  initialNotifications: {
    subscription: boolean;
    postalConnection: boolean;
    system: boolean;
    email: boolean;
  };
}) {
  const { t } = useTranslation();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettingsMutation();
  const { toast } = useToast();
  const [language, setLanguage] = useState(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dateFormat, setDateFormat] = useState(initialDateFormat);
  const [notifications, setNotifications] = useState(initialNotifications);

  async function handleSave() {
    try {
      await updateSettings({ language, timezone, dateFormat, notifications });
      syncLanguage(language);
      toast({ title: t("profile.settingsSaved"), color: "success" });
    } catch (error) {
      toast({
        title: t("profile.settingsSaveFailed"),
        description:
          error instanceof Error ? error.message : t("profile.somethingWentWrong"),
        color: "error",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900">{t("layout.settings")}</h2>

      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-neutral-800">{t("profile.preferences")}</h3>

        <Select
          label={t("common.language")}
          options={[
            { value: "uk", label: t("common.ukrainian") },
            { value: "en", label: t("common.english") },
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

        <div className="border-t border-neutral-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">
            {t("profile.notificationsHeading")}
          </h3>
          <div className="flex flex-col gap-3">
            <Switch
              label={t("profile.subscriptionUpdates")}
              color="teal"
              checked={notifications.subscription}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  subscription: checked,
                }))
              }
            />
            <Switch
              label={t("profile.postalConnectionAlerts")}
              color="teal"
              checked={notifications.postalConnection}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  postalConnection: checked,
                }))
              }
            />
            <Switch
              label={t("profile.systemNotifications")}
              color="teal"
              checked={notifications.system}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  system: checked,
                }))
              }
            />
            <Switch
              label={t("profile.emailNotifications")}
              color="teal"
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  email: checked,
                }))
              }
            />
            <Switch
              label={t("profile.accountAlertsAlwaysOn")}
              color="teal"
              checked={true}
              disabled
            />
          </div>
        </div>

        <Button color="teal" disabled={isPending} onClick={handleSave}>
          {isPending ? t("common.saving") : t("common.saveSettings")}
        </Button>
      </div>
    </div>
  );
}
