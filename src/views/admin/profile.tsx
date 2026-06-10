import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">{t("adminProfile.title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("adminProfile.description")}</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <Section title={t("adminProfile.sectionProfile")}>
          <Row label={t("adminProfile.name")} value={`${ADMIN.firstName} ${ADMIN.lastName}`} />
          <Row label={t("common.email")} value={ADMIN.email} />
          <Row label={t("adminProfile.role")}>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              ADMIN.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
            }`}>
              {ADMIN.role}
            </span>
          </Row>
          <Row label={t("adminProfile.status")}>
            <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
              {ADMIN.status}
            </span>
          </Row>
        </Section>

        <Section title={t("adminProfile.sectionChangePassword")}>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder={t("adminProfile.currentPassword")}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <input
              type="password"
              placeholder={t("common.newPassword")}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <input
              type="password"
              placeholder={t("adminProfile.confirmNewPassword")}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <Button color="teal" className="self-start">{t("adminProfile.updatePassword")}</Button>
          </div>
        </Section>

        <Section title={t("adminProfile.sectionTwoFactor")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-700">{t("adminProfile.totpAuthenticator")}</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {ADMIN.role === "ADMIN" ? t("adminProfile.requiredForAdmin") : t("adminProfile.optionalForSuperAdmin")}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              ADMIN.twoFactorEnabled ? "bg-teal-100 text-teal-800" : "bg-neutral-100 text-neutral-500"
            }`}>
              {ADMIN.twoFactorEnabled ? t("common.enabled") : t("common.disabled")}
            </span>
          </div>
          {!ADMIN.twoFactorEnabled && (
            <Button color="teal" className="self-start text-sm">{t("adminProfile.setUp2fa")}</Button>
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
