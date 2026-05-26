interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4 py-3">
      <dt className="w-36 shrink-0 text-sm font-medium text-neutral-500">
        {label}
      </dt>
      <dd className="text-sm text-neutral-900">{value}</dd>
    </div>
  );
}
