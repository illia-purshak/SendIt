import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { APP_ROUTES } from "@/constants/app-routes";
import { useShipmentDetailQuery } from "@/api/shipments";
import { Spinner } from "@/components/Loader/Spinner";
import type { ShipmentStatus } from "@/types/shipment";

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "Draft",
  CREATED: "Created",
  PREPARING: "Preparing",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  UNKNOWN: "Unknown",
};

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium text-neutral-800">{value ?? "—"}</dd>
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
  const { operator, ref } = useParams<{ operator: string; ref: string }>();
  const navigate = useNavigate();

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
        <BackButton onClick={() => navigate(APP_ROUTES.shipments)} />
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-600">
            Failed to load shipment details.
          </p>
        </div>
      </main>
    );
  }

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <BackButton onClick={() => navigate(APP_ROUTES.shipments)} />

      {/* Header */}
      <div className="mt-6 mb-8 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Tracking number
          </p>
          <p className="font-mono text-2xl font-semibold tracking-tight text-neutral-900">
            {data.ttn ?? "—"}
          </p>
          <p className="mt-1.5 text-sm text-neutral-500">{data.operatorName}</p>
        </div>
        <span
          className={[
            "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset",
            STATUS_CLASS[data.normalizedStatus],
          ].join(" ")}
        >
          {STATUS_LABEL[data.normalizedStatus]}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-6">
        {/* Recipient */}
        <Section title="Recipient">
          <SectionCard>
            <InfoRow label="Name" value={data.recipientName} />
            <InfoRow label="Phone" value={data.recipientPhone} />
            <InfoRow label="Email" value={data.recipientEmail} />
            <InfoRow label="Delivery address" value={data.deliveryAddress} />
          </SectionCard>
        </Section>

        {/* Parcel */}
        <Section title="Parcel">
          <SectionCard>
            <InfoRow
              label="Weight"
              value={data.weight != null ? `${data.weight} kg` : null}
            />
            <InfoRow
              label="Declared value"
              value={
                data.declaredValue != null ? `₴${data.declaredValue}` : null
              }
            />
            <InfoRow label="Raw status" value={data.rawStatus} />
          </SectionCard>
        </Section>

        {/* Timestamps */}
        <Section title="Dates">
          <SectionCard>
            <InfoRow label="Created" value={formatDate(data.createdAt)} />
            <InfoRow
              label="Last synced"
              value={formatDate(data.lastSyncedAt)}
            />
            {data.scheduledDeliveryDate && (
              <InfoRow
                label="Est. delivery"
                value={formatDate(data.scheduledDeliveryDate)}
              />
            )}
          </SectionCard>
        </Section>

        {/* Tracking history */}
        {data.trackingHistory.length > 0 && (
          <Section title="Tracking history">
            <ol className="relative space-y-0">
              {data.trackingHistory.map((item, i) => (
                <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Connector line */}
                  {i < data.trackingHistory.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-5 left-2.25 h-full w-px bg-neutral-200"
                    />
                  )}

                  {/* Dot */}
                  <span
                    className={[
                      "relative z-10 mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full ring-2 ring-white",
                      i === 0 ? "bg-indigo-500" : "bg-neutral-200",
                    ].join(" ")}
                  />

                  {/* Content */}
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
    >
      <ArrowLeft size={15} />
      Back to shipments
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
