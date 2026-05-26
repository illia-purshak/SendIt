import { useRef, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAdminSubscriptionsQuery,
  useAdminUpdateSubscriptionMutation,
  useSubscriptionPlansQuery,
  SubscriptionError,
  type AdminSubscriptionRow,
} from "@/api/subscriptions";
import { APP_ROUTES } from "@/constants/app-routes";
import { useToast } from "@/components/Toast/use-toast";
import { IconButton } from "@/components/IconButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog";
import type { SubscriptionStatus, DiscountType } from "@/types/subscription";

const STATUS_CLASS: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  QUEUED: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-neutral-100 text-neutral-500",
};

function planBadgeClass(level: number): string {
  if (level === 0) return "bg-neutral-100 text-neutral-600";
  if (level === 1) return "bg-blue-100 text-blue-800";
  if (level === 2) return "bg-purple-100 text-purple-800";
  return "bg-orange-100 text-orange-800";
}

function fmt(iso: string) {
  return iso.slice(0, 10);
}

const LIMIT = 20;

interface ChangePlanDialogProps {
  row: AdminSubscriptionRow;
  open: boolean;
  onClose: () => void;
}

function ChangePlanDialog({ row, open, onClose }: ChangePlanDialogProps) {
  const { data: plansData } = useSubscriptionPlansQuery();
  const { mutateAsync, isPending } = useAdminUpdateSubscriptionMutation();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<number>(row.plan.id);

  async function handleConfirm() {
    try {
      await mutateAsync({ id: row.id, action: "changePlan", planId: selectedPlanId });
      toast({ title: "Plan updated", color: "success" });
      onClose();
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  return (
    <AlertDialog open={open} color="green">
      <AlertDialogContent>
        <AlertDialogTitle>Change plan for {row.companyName}</AlertDialogTitle>
        <AlertDialogDescription>
          This change takes effect immediately as an admin override.
        </AlertDialogDescription>
        <div className="mt-4">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {plansData?.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {Number(plan.price) === 0 ? "Free" : `UAH ${plan.price}/mo`}
              </option>
            ))}
          </select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Saving..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ExtendDialogProps {
  row: AdminSubscriptionRow;
  open: boolean;
  onClose: () => void;
}

function ExtendDialog({ row, open, onClose }: ExtendDialogProps) {
  const { mutateAsync, isPending } = useAdminUpdateSubscriptionMutation();
  const { toast } = useToast();

  async function handleConfirm() {
    try {
      await mutateAsync({ id: row.id, action: "extend", days: 30 });
      toast({ title: "Subscription extended by 1 month", color: "success" });
      onClose();
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  return (
    <AlertDialog open={open} color="green">
      <AlertDialogContent>
        <AlertDialogTitle>Extend subscription</AlertDialogTitle>
        <AlertDialogDescription>
          Extend {row.companyName}'s subscription by one month?
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Extending..." : "Extend"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CancelDialogProps {
  row: AdminSubscriptionRow;
  open: boolean;
  onClose: () => void;
}

function CancelDialog({ row, open, onClose }: CancelDialogProps) {
  const { mutateAsync, isPending } = useAdminUpdateSubscriptionMutation();
  const { toast } = useToast();

  async function handleConfirm() {
    try {
      await mutateAsync({ id: row.id, action: "cancel" });
      toast({ title: "Subscription cancelled", color: "success" });
      onClose();
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  return (
    <AlertDialog open={open} color="error">
      <AlertDialogContent>
        <AlertDialogTitle>Cancel subscription</AlertDialogTitle>
        <AlertDialogDescription>
          Cancel {row.companyName}'s subscription? They will remain on the current
          plan until the period ends.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Keep active</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Cancelling..." : "Cancel subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DiscountDialogProps {
  row: AdminSubscriptionRow;
  open: boolean;
  onClose: () => void;
}

function DiscountDialog({ row, open, onClose }: DiscountDialogProps) {
  const { mutateAsync, isPending } = useAdminUpdateSubscriptionMutation();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("ONE_TIME");

  async function handleConfirm() {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast({ title: "Enter a valid amount", color: "warning" });
      return;
    }

    try {
      await mutateAsync({ id: row.id, action: "setDiscount", amount: parsed, discountType });
      toast({ title: "Discount applied", color: "success" });
      onClose();
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  return (
    <AlertDialog open={open} color="green">
      <AlertDialogContent>
        <AlertDialogTitle>Set individual discount</AlertDialogTitle>
        <AlertDialogDescription>
          Custom billing amount for {row.companyName} at the next billing cycle.
        </AlertDialogDescription>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Custom amount (UAH)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 299"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Discount type
            </label>
            <div className="flex gap-4">
              {(["ONE_TIME", "PERMANENT"] as DiscountType[]).map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700"
                >
                  <input
                    type="radio"
                    name={`discountType-${row.id}`}
                    value={type}
                    checked={discountType === type}
                    onChange={() => setDiscountType(type)}
                    className="accent-green-600"
                  />
                  {type === "ONE_TIME" ? "One-time" : "Permanent"}
                </label>
              ))}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Saving..." : "Apply"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ActionType = "change-plan" | "extend" | "cancel" | "discount" | null;

function SubscriptionActionMenu({ row }: { row: AdminSubscriptionRow }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ActionType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function pick(nextAction: ActionType) {
    setOpen(false);
    setAction(nextAction);
  }

  return (
    <div className="relative" ref={menuRef}>
      <IconButton
        aria-label="Edit subscription overrides"
        variant="ghost"
        color="neutral"
        size="sm"
        title="Edit subscription overrides"
        onClick={() => setOpen((value) => !value)}
      >
        <Pencil size={14} />
      </IconButton>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {([
            { label: "Change plan", value: "change-plan" },
            { label: "Extend 1 month", value: "extend" },
            { label: "Cancel", value: "cancel" },
            { label: "Set discount", value: "discount" },
          ] as { label: string; value: ActionType }[]).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => pick(item.value)}
              className={[
                "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-neutral-50",
                item.value === "cancel" ? "text-red-600" : "text-neutral-700",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {action === "change-plan" && (
        <ChangePlanDialog row={row} open onClose={() => setAction(null)} />
      )}
      {action === "extend" && <ExtendDialog row={row} open onClose={() => setAction(null)} />}
      {action === "cancel" && <CancelDialog row={row} open onClose={() => setAction(null)} />}
      {action === "discount" && (
        <DiscountDialog row={row} open onClose={() => setAction(null)} />
      )}
    </div>
  );
}

const PLAN_LEVELS = [
  { value: 0, label: "Free" },
  { value: 1, label: "Pro" },
  { value: 2, label: "Business" },
] as const;

const STATUSES: SubscriptionStatus[] = ["ACTIVE", "PAUSED", "QUEUED", "EXPIRED"];

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<number | "">("");
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminSubscriptionsQuery({
    plan: plan !== "" ? plan : undefined,
    status: status || undefined,
    search: search || undefined,
    page,
    limit: LIMIT,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Subscriptions</h1>
        <p className="mt-1 text-sm text-neutral-500">
          All active and historical platform subscriptions.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleFilterChange();
          }}
          className="h-9 w-56 rounded-lg border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value === "" ? "" : Number(e.target.value));
            handleFilterChange();
          }}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">All plans</option>
          {PLAN_LEVELS.map((planOption) => (
            <option key={planOption.value} value={planOption.value}>
              {planOption.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriptionStatus | "");
            handleFilterChange();
          }}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">All statuses</option>
          {STATUSES.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {statusOption}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subscriptions.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Client</Th>
              <Th>Plan</Th>
              <Th>Period end</Th>
              <Th>Status</Th>
              <Th>Auto-renew</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-neutral-100">
                  {Array.from({ length: 6 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && data && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">
                  No subscriptions found.
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{row.companyName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass(row.plan.level)}`}
                    >
                      {row.plan.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {row.plan.level === 0 ? "-" : fmt(row.periodEnd)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {row.plan.level === 0 ? "-" : row.autoRenew ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex w-fit items-center justify-end gap-1">
                      <IconButton
                        aria-label="View subscription owner"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        title="View subscription owner"
                        onClick={() =>
                          navigate(
                            APP_ROUTES.admin.userDetail.replace(":id", String(row.userId)),
                          )
                        }
                      >
                        <Eye size={14} />
                      </IconButton>
                      <SubscriptionActionMenu row={row} />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!meta?.hasPreviousPage}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {meta?.page ?? page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!meta?.hasNextPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </th>
  );
}
