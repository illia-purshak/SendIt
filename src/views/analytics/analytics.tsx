import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t("analyticsPage.title")}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {t("analyticsPage.description")}
          </p>
        </div>
      </div>

      <div
        onDoubleClick={() => navigate("/analytics/dashboard")}
        className="flex min-h-80 cursor-default flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <BarChart3 size={28} />
        </div>
        <p className="text-base font-semibold text-neutral-800">{t("analyticsPage.comingSoon")}</p>
        <p className="mt-1.5 max-w-xs text-sm text-neutral-500">
          {t("analyticsPage.comingSoonDescription")}
        </p>
      </div>
    </main>
  );
}
