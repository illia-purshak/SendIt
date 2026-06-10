import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAdminUserQuery,
  useAdminUpdateUserStatusMutation,
  useAdminDisconnectPostalConnectionMutation,
} from "@/api/admin-users";
import {
  useAdminUserSubscriptionHistoryQuery,
  useAdminUserSubscriptionActionMutation,
  useAdminPlansQuery,
  SubscriptionError,
  type AdminSubscriptionAction,
} from "@/api/subscriptions";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Loader/Spinner";
import { useToast } from "@/components/Toast/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog";
import type { DiscountType, SubscriptionStatus, UserSubscriptionBalance } from "@/types/subscription";
import type { AdminUserPostalConnection } from "@/types/admin-user";

const SUB_STATUS_CLASS: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-teal-100 text-teal-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  QUEUED: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-neutral-100 text-neutral-500",
};

const CONN_STATUS_CLASS: Record<"ACTIVE" | "BLOCKED" | "INVALID", string> = {
  ACTIVE: "bg-teal-100 text-teal-700",
  BLOCKED: "bg-yellow-100 text-yellow-800",
  INVALID: "bg-red-100 text-red-700",
};

const USER_STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-teal-100 text-teal-800",
  INACTIVE: "bg-neutral-100 text-neutral-500",
  BANNED: "bg-red-100 text-red-700",
  DELETED: "bg-neutral-100 text-neutral-400",
};

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

// ── Subscription action dialogs ──────────────────────────────────────────────

interface SubDialogBaseProps {
  balance: UserSubscriptionBalance;
  open: boolean;
  onClose: () => void;
  onConfirm: (body: AdminSubscriptionAction) => Promise<void>;
  isPending: boolean;
}

function ChangePlanDialog({ balance, open, onClose, onConfirm, isPending }: SubDialogBaseProps) {
  const { data: plansData } = useAdminPlansQuery({ isPublic: true, limit: 100 });
  const plans = plansData?.items ?? [];
  const [selectedPlanId, setSelectedPlanId] = useState<number>(balance.planId);

  return (
    <AlertDialog open={open} color="teal">
      <AlertDialogContent>
        <AlertDialogTitle>Change plan</AlertDialogTitle>
        <AlertDialogDescription>
          This change takes effect immediately as an admin override.
        </AlertDialogDescription>
        <div className="mt-4">
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.price === 0 ? "Free" : `UAH ${plan.price}/mo`}
              </option>
            ))}
          </select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm({ action: "changePlan", planId: selectedPlanId })}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ExtendDialog({ open, onClose, onConfirm, isPending }: Omit<SubDialogBaseProps, "balance"> & { balance?: UserSubscriptionBalance }) {
  const [days, setDays] = useState("30");

  return (
    <AlertDialog open={open} color="teal">
      <AlertDialogContent>
        <AlertDialogTitle>Extend subscription</AlertDialogTitle>
        <AlertDialogDescription>Add days to the current period end.</AlertDialogDescription>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-neutral-500">Days to add</label>
          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm({ action: "extend", days: Number(days) })}
            disabled={isPending || !days || Number(days) < 1}
          >
            {isPending ? "Extending..." : "Extend"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DiscountDialog({ open, onClose, onConfirm, isPending }: Omit<SubDialogBaseProps, "balance"> & { balance?: UserSubscriptionBalance }) {
  const [amount, setAmount] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("ONE_TIME");

  return (
    <AlertDialog open={open} color="teal">
      <AlertDialogContent>
        <AlertDialogTitle>Set individual discount</AlertDialogTitle>
        <AlertDialogDescription>Custom billing amount at the next billing cycle.</AlertDialogDescription>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Custom amount (UAH)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 299"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Discount type</label>
            <div className="flex gap-4">
              {(["ONE_TIME", "PERMANENT"] as DiscountType[]).map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="radio"
                    name="discount-type"
                    value={type}
                    checked={discountType === type}
                    onChange={() => setDiscountType(type)}
                    className="accent-teal-600"
                  />
                  {type === "ONE_TIME" ? "One-time" : "Permanent"}
                </label>
              ))}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              onConfirm({ action: "setDiscount", amount: parseFloat(amount), discountType })
            }
            disabled={isPending || !amount || Number.isNaN(parseFloat(amount))}
          >
            {isPending ? "Saving..." : "Apply"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SimpleActionDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  confirmLabel,
  color,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  color?: "teal" | "error";
}) {
  return (
    <AlertDialog open={open} color={color ?? "teal"}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type SubActionType =
  | "change-plan"
  | "extend"
  | "discount"
  | "cancel"
  | "suspend"
  | "reactivate"
  | null;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: user, isLoading } = useAdminUserQuery(userId);
  const [historyPage, setHistoryPage] = useState(1);
  const { data: history } = useAdminUserSubscriptionHistoryQuery(userId, {
    page: historyPage,
    limit: 10,
  });

  const activeBalance =
    user?.subscriptionBalances?.find((b) => b.status === "ACTIVE")
    ?? user?.subscriptionBalances?.[0]
    ?? null;

  const [subAction, setSubAction] = useState<SubActionType>(null);
  const [disconnectConn, setDisconnectConn] = useState<AdminUserPostalConnection | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmUnblock, setConfirmUnblock] = useState(false);

  const subActionMutation = useAdminUserSubscriptionActionMutation();
  const disconnectMutation = useAdminDisconnectPostalConnectionMutation();
  const updateStatusMutation = useAdminUpdateUserStatusMutation();

  async function handleSubAction(body: AdminSubscriptionAction) {
    if (!activeBalance) return;
    try {
      await subActionMutation.mutateAsync({
        userId,
        balanceId: activeBalance.id,
        ...body,
      });
      toast({ title: "Done", color: "success" });
      setSubAction(null);
    } catch (err) {
      const msg = err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  async function handleDisconnect() {
    if (!disconnectConn) return;
    try {
      await disconnectMutation.mutateAsync({ userId, connectionId: disconnectConn.id });
      toast({ title: "Operator disconnected", color: "success" });
      setDisconnectConn(null);
    } catch {
      toast({ title: "Failed to disconnect operator", color: "error" });
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await updateStatusMutation.mutateAsync({ id: userId, status });
      toast({ title: "Status updated", color: "success" });
      setConfirmBlock(false);
      setConfirmUnblock(false);
    } catch {
      toast({ title: "Failed to update status", color: "error" });
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="py-10">
        <p className="text-sm text-neutral-500">User not found.</p>
      </main>
    );
  }

  const connections = user.postalConnections ?? [];
  const historyItems = history?.data ?? [];
  const historyTotalPages = history?.totalPages ?? 0;

  return (
    <main className="py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          onClick={() => navigate(APP_ROUTES.admin.users)}
        >
          ← Back
        </Button>
        <h1 className="text-xl font-semibold text-neutral-900">
          {user.profile?.companyName ?? user.email ?? `User #${user.id}`}
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${USER_STATUS_CLASS[user.status] ?? "bg-neutral-100 text-neutral-500"}`}
        >
          {user.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Organization */}
          <InfoCard title="Organization">
            <Row label="Company" value={user.profile?.companyName ?? "—"} />
            <Row label="First name" value={user.profile?.firstName ?? "—"} />
            <Row label="Last name" value={user.profile?.lastName ?? "—"} />
            <Row label="EDRPOU" value={user.profile?.edrpou ?? "—"} />
            <Row label="Tax number" value={user.profile?.taxNumber ?? "—"} />
            <Row label="Legal address" value={user.profile?.legalAddress ?? "—"} />
            <Row label="Contact person" value={user.profile?.contactPerson ?? "—"} />
            <Row label="Email" value={user.email ?? "—"} />
            <Row label="Phone" value={user.profile?.phone ?? "—"} />
            <Row label="Registered" value={fmt(user.createdAt)} />
          </InfoCard>

          {/* Postal connections */}
          <InfoCard title="Connected operators">
            {connections.length === 0 ? (
              <p className="text-sm text-neutral-400">No operators connected.</p>
            ) : (
              connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {conn.postalService.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{fmt(conn.connectedAt)}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONN_STATUS_CLASS[conn.status]}`}
                    >
                      {conn.status}
                    </span>
                    <Button
                      variant="outline"
                      color="error"
                      size="sm"
                      onClick={() => setDisconnectConn(conn)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))
            )}
          </InfoCard>

          {/* Billing history */}
          <InfoCard title="Billing history">
            {historyItems.length === 0 ? (
              <p className="text-sm text-neutral-400">No billing records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-medium uppercase text-neutral-400">
                      <th className="pb-2 pr-4">Plan</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2 pr-4">Period</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Paid at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((rec) => (
                      <tr key={rec.id} className="border-b border-neutral-50 last:border-0">
                        <td className="py-2 pr-4 text-neutral-900">{rec.plan.name}</td>
                        <td className="py-2 pr-4 text-neutral-700">UAH {rec.amount}</td>
                        <td className="py-2 pr-4 text-neutral-500">
                          {fmt(rec.periodStart)} — {fmt(rec.periodEnd)}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2 text-neutral-500">{fmt(rec.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {historyTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="outline"
                  color="neutral"
                  size="sm"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-neutral-400">
                  {historyPage} / {historyTotalPages}
                </span>
                <Button
                  variant="outline"
                  color="neutral"
                  size="sm"
                  disabled={historyPage >= historyTotalPages}
                  onClick={() => setHistoryPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </InfoCard>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Subscription */}
          <InfoCard title="Subscription">
            {!activeBalance ? (
              <p className="text-sm text-neutral-400">No active subscription.</p>
            ) : (
              <>
                <Row label="Plan" value={activeBalance.plan.name} />
                <Row
                  label="Price"
                  value={
                    activeBalance.customAmount
                      ? `UAH ${activeBalance.customAmount} (custom)`
                      : `UAH ${activeBalance.plan.price}/mo`
                  }
                />
                <Row label="Period end" value={fmt(activeBalance.periodEnd)} />
                <Row label="Period type" value={activeBalance.periodType} />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Status</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SUB_STATUS_CLASS[activeBalance.status]}`}
                  >
                    {activeBalance.status}
                  </span>
                </div>
                <Row label="Auto-renew" value={activeBalance.autoRenew ? "Yes" : "No"} />
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    color="teal"
                    size="sm"
                    className="w-full"
                    onClick={() => setSubAction("change-plan")}
                  >
                    Change plan
                  </Button>
                  <Button
                    variant="outline"
                    color="neutral"
                    size="sm"
                    className="w-full"
                    onClick={() => setSubAction("extend")}
                  >
                    Extend
                  </Button>
                  <Button
                    variant="outline"
                    color="neutral"
                    size="sm"
                    className="w-full"
                    onClick={() => setSubAction("discount")}
                  >
                    Set discount
                  </Button>
                  {activeBalance.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      color="neutral"
                      size="sm"
                      className="w-full"
                      onClick={() => setSubAction("suspend")}
                    >
                      Suspend
                    </Button>
                  )}
                  {activeBalance.status === "PAUSED" && (
                    <Button
                      variant="outline"
                      color="teal"
                      size="sm"
                      className="w-full"
                      onClick={() => setSubAction("reactivate")}
                    >
                      Reactivate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    color="error"
                    size="sm"
                    className="w-full"
                    onClick={() => setSubAction("cancel")}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </InfoCard>

          {/* Account actions */}
          <InfoCard title="Account actions">
            <div className="flex flex-col gap-2">
              {user.status !== "ACTIVE" && user.status !== "BANNED" && (
                <Button
                  color="teal"
                  size="sm"
                  className="w-full"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => handleStatusChange("ACTIVE")}
                >
                  Set active
                </Button>
              )}
              {user.status !== "BANNED" && (
                <Button
                  variant="outline"
                  color="error"
                  size="sm"
                  className="w-full"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => setConfirmBlock(true)}
                >
                  Block
                </Button>
              )}
              {user.status === "BANNED" && (
                <Button
                  variant="outline"
                  color="teal"
                  size="sm"
                  className="w-full"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => setConfirmUnblock(true)}
                >
                  Unblock
                </Button>
              )}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Subscription action dialogs */}
      {activeBalance && (
        <>
          <ChangePlanDialog
            balance={activeBalance}
            open={subAction === "change-plan"}
            onClose={() => setSubAction(null)}
            onConfirm={handleSubAction}
            isPending={subActionMutation.isPending}
          />
          <ExtendDialog
            open={subAction === "extend"}
            onClose={() => setSubAction(null)}
            onConfirm={handleSubAction}
            isPending={subActionMutation.isPending}
          />
          <DiscountDialog
            open={subAction === "discount"}
            onClose={() => setSubAction(null)}
            onConfirm={handleSubAction}
            isPending={subActionMutation.isPending}
          />
          <SimpleActionDialog
            open={subAction === "cancel"}
            onClose={() => setSubAction(null)}
            onConfirm={() => handleSubAction({ action: "cancel" })}
            isPending={subActionMutation.isPending}
            title="Cancel subscription"
            description="Disable auto-renew? The user remains on the current plan until the period ends."
            confirmLabel="Cancel subscription"
            color="error"
          />
          <SimpleActionDialog
            open={subAction === "suspend"}
            onClose={() => setSubAction(null)}
            onConfirm={() => handleSubAction({ action: "suspend" })}
            isPending={subActionMutation.isPending}
            title="Suspend subscription"
            description="Pause this subscription? The user will lose access to paid features."
            confirmLabel="Suspend"
            color="error"
          />
          <SimpleActionDialog
            open={subAction === "reactivate"}
            onClose={() => setSubAction(null)}
            onConfirm={() => handleSubAction({ action: "reactivate" })}
            isPending={subActionMutation.isPending}
            title="Reactivate subscription"
            description="Resume this subscription and restore access to paid features."
            confirmLabel="Reactivate"
            color="teal"
          />
        </>
      )}

      {/* Disconnect operator dialog */}
      <SimpleActionDialog
        open={disconnectConn !== null}
        onClose={() => setDisconnectConn(null)}
        onConfirm={handleDisconnect}
        isPending={disconnectMutation.isPending}
        title="Disconnect operator"
        description={`Forcefully disconnect ${disconnectConn?.postalService.name ?? "this operator"} for this user?`}
        confirmLabel="Disconnect"
        color="error"
      />

      {/* Block / Unblock confirmation dialogs */}
      <SimpleActionDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => handleStatusChange("BANNED")}
        isPending={updateStatusMutation.isPending}
        title="Block user"
        description="This user will immediately lose access to the platform."
        confirmLabel="Block"
        color="error"
      />
      <SimpleActionDialog
        open={confirmUnblock}
        onClose={() => setConfirmUnblock(false)}
        onConfirm={() => handleStatusChange("ACTIVE")}
        isPending={updateStatusMutation.isPending}
        title="Unblock user"
        description="This user will regain access to the platform."
        confirmLabel="Unblock"
        color="teal"
      />
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm text-neutral-900">{value}</span>
    </div>
  );
}
