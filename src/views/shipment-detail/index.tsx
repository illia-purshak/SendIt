import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_ROUTES } from "@/constants/app-routes";
import { useShipmentDetailQuery } from "@/api/shipments";
import { Spinner } from "@/components/Loader/Spinner";
import type { ShipmentStatus } from "@/types/shipment";

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  CREATED: "bg-blue-50 text-blue-700 ring-blue-100",
  PREPARING: "bg-amber-50 text-amber-700 ring-amber-100",
  IN_TRANSIT: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-neutral-100 text-neutral-500 ring-neutral-200",
  RETURNED: "bg-orange-50 text-orange-700 ring-orange-100",
  UNKNOWN: "bg-neutral-100 text-neutral-400 ring-neutral-200",
};

function InfoRow({
  label,
  value,
  emptyValue,
}: {
  label: string;
  value: React.ReactNode;
  emptyValue: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium text-neutral-800">{value ?? emptyValue}</dd>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-5 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs sm:grid-cols-2">
      {children}
    </dl>
  );
}

export default function ShipmentDetailView() {
  const { t } = useTranslation();
  const { operator, ref } = useParams<{ operator: string; ref: string }>();
  const navigate = useNavigate();

  const statusLabel: Record<ShipmentStatus, string> = {
    DRAFT: t("shipmentsPage.status.draft"),
    CREATED: t("shipmentsPage.status.created"),
    PREPARING: t("shipmentsPage.status.preparing"),
    IN_TRANSIT: t("shipmentsPage.status.inTransit"),
    DELIVERED: t("shipmentsPage.status.delivered"),
    CANCELLED: t("shipmentsPage.status.cancelled"),
    RETURNED: t("shipmentsPage.status.returned"),
    UNKNOWN: t("shipmentsPage.status.unknown"),
  };

  const { data, isLoading, error } = useShipmentDetailQuery(
    operator ?? "",
    ref ?? "",
  );

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <BackButton
          label={t("shipmentDetailPage.backToShipments")}
          onClick={() => navigate(APP_ROUTES.shipments)}
        />
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-600">
            {t("shipmentDetailPage.failedToLoad")}
          </p>
        </div>
      </main>
    );
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackButton
        label={t("shipmentDetailPage.backToShipments")}
        onClick={() => navigate(APP_ROUTES.shipments)}
      />

      <div className="mt-6 mb-8 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            {t("shipmentDetailPage.trackingNumber")}
          </p>
          <p className="font-mono text-2xl font-semibold tracking-tight text-neutral-900">
            {data.ttn ?? t("shipmentsPage.dash")}
          </p>
          <p className="mt-1.5 text-sm text-neutral-500">{data.operatorName}</p>
        </div>
        <span
          className={[
            "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset",
            STATUS_CLASS[data.normalizedStatus],
          ].join(" ")}
        >
          {statusLabel[data.normalizedStatus]}
        </span>
      </div>

      <div className="space-y-6">
        <Section title={t("shipmentDetailPage.sections.recipient")}>
          <SectionCard>
            <InfoRow label={t("shipmentDetailPage.fields.name")} value={data.recipientName} emptyValue={t("shipmentsPage.dash")} />
            <InfoRow label={t("shipmentDetailPage.fields.phone")} value={data.recipientPhone} emptyValue={t("shipmentsPage.dash")} />
            <InfoRow label={t("shipmentDetailPage.fields.email")} value={data.recipientEmail} emptyValue={t("shipmentsPage.dash")} />
            <InfoRow label={t("shipmentDetailPage.fields.deliveryAddress")} value={data.deliveryAddress} emptyValue={t("shipmentsPage.dash")} />
          </SectionCard>
        </Section>

        <Section title={t("shipmentDetailPage.sections.parcel")}>
          <SectionCard>
            <InfoRow
              label={t("shipmentDetailPage.fields.weight")}
              value={data.weight != null ? t("shipmentDetailPage.weightValue", { value: data.weight }) : null}
              emptyValue={t("shipmentsPage.dash")}
            />
            <InfoRow
              label={t("shipmentDetailPage.fields.declaredValue")}
              value={
                data.declaredValue != null ? t("shipmentDetailPage.declaredValueValue", { value: data.declaredValue }) : null
              }
              emptyValue={t("shipmentsPage.dash")}
            />
            <InfoRow label={t("shipmentDetailPage.fields.rawStatus")} value={data.rawStatus} emptyValue={t("shipmentsPage.dash")} />
          </SectionCard>
        </Section>

        <Section title={t("shipmentDetailPage.sections.dates")}>
          <SectionCard>
            <InfoRow label={t("shipmentDetailPage.fields.created")} value={formatDate(data.createdAt)} emptyValue={t("shipmentsPage.dash")} />
            <InfoRow
              label={t("shipmentDetailPage.fields.lastSynced")}
              value={formatDate(data.lastSyncedAt)}
              emptyValue={t("shipmentsPage.dash")}
            />
            {data.scheduledDeliveryDate && (
              <InfoRow
                label={t("shipmentDetailPage.fields.estimatedDelivery")}
                value={formatDate(data.scheduledDeliveryDate)}
                emptyValue={t("shipmentsPage.dash")}
              />
            )}
          </SectionCard>
        </Section>

        {data.trackingHistory.length > 0 && (
          <Section title={t("shipmentDetailPage.sections.trackingHistory")}>
            <ol className="relative space-y-0">
              {data.trackingHistory.map((item, i) => (
                <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
                  {i < data.trackingHistory.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-5 left-2.25 h-full w-px bg-neutral-200"
                    />
                  )}

                  <span
                    className={[
                      "relative z-10 mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full ring-2 ring-white",
                      i === 0 ? "bg-indigo-500" : "bg-neutral-200",
                    ].join(" ")}
                  />

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-xs">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.codeName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin size={11} className="shrink-0" />
                        {item.settlement}, {item.countryCode}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs tabular-nums text-neutral-400">
                      {new Date(item.date).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    </main>
  );
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
