import { useState } from "react";
import { useUpdateSettingsMutation } from "@/api/auth";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select/Select";
import { Switch } from "@/components/Switch";
import { useToast } from "@/components/Toast/use-toast";
import { useProfileRouteData } from "../useProfileRouteData";

const LANGUAGE_OPTIONS = [
  { value: "uk", label: "Ukrainian" },
  { value: "en", label: "English" },
];

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
      initialLanguage={data?.settings?.language ?? "uk"}
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
  const { mutateAsync: updateSettings, isPending } = useUpdateSettingsMutation();
  const { toast } = useToast();
  const [language, setLanguage] = useState(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dateFormat, setDateFormat] = useState(initialDateFormat);
  const [notifications, setNotifications] = useState(initialNotifications);

  async function handleSave() {
    try {
      await updateSettings({ language, timezone, dateFormat, notifications });
      toast({ title: "Settings saved", color: "success" });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        color: "error",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900">Settings</h2>

      <div className="flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-neutral-800">Preferences</h3>

        <Select
          label="Language"
          options={LANGUAGE_OPTIONS}
          value={language}
          onValueChange={setLanguage}
          color="green"
        />

        <Select
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={timezone}
          onValueChange={setTimezone}
          color="green"
        />

        <Select
          label="Date format"
          options={DATE_FORMAT_OPTIONS}
          value={dateFormat}
          onValueChange={setDateFormat}
          color="green"
        />

        <div className="border-t border-neutral-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">
            Notifications
          </h3>
          <div className="flex flex-col gap-3">
            <Switch
              label="Subscription updates"
              color="green"
              checked={notifications.subscription}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  subscription: checked,
                }))
              }
            />
            <Switch
              label="Postal connection alerts"
              color="green"
              checked={notifications.postalConnection}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  postalConnection: checked,
                }))
              }
            />
            <Switch
              label="System notifications"
              color="green"
              checked={notifications.system}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  system: checked,
                }))
              }
            />
            <Switch
              label="Email notifications"
              color="green"
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications((current) => ({
                  ...current,
                  email: checked,
                }))
              }
            />
            <Switch
              label="Account alerts (always on)"
              color="green"
              checked={true}
              disabled
            />
          </div>
        </div>

        <Button color="green" disabled={isPending} onClick={handleSave}>
          {isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
