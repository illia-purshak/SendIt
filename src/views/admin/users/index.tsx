import { Eye, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { IconButton } from "@/components/IconButton";
import { Spinner } from "@/components/Loader/Spinner";
import { useAdminUsersQuery, useAdminUpdateUserStatusMutation } from "@/api/admin-users";
import { toastStore } from "@/store/toastStore";

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-neutral-100 text-neutral-500",
  BANNED: "bg-red-100 text-red-700",
  DELETED: "bg-neutral-100 text-neutral-400",
};

const PLAN_CLASS: Record<string, string> = {
  FREE: "bg-neutral-100 text-neutral-600",
  PRO: "bg-blue-100 text-blue-800",
  BUSINESS: "bg-purple-100 text-purple-800",
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminUsersQuery({ page: 1, limit: 20 });
  const updateStatusMutation = useAdminUpdateUserStatusMutation();

  const users = data?.items ?? [];

  async function handleToggleBlock(id: number, isBlocked: boolean) {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: isBlocked ? "ACTIVE" : "BANNED",
      });
      toastStore.toast({
        title: isBlocked ? "User unblocked" : "User blocked",
        color: "success",
      });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update user status",
        color: "error",
      });
    }
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
        <p className="mt-1 text-sm text-neutral-500">All registered client organizations.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <p className="py-10 text-center text-sm text-red-500">Failed to load users.</p>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <Th>Company</Th>
                <Th>Email</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Registered</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const plan = user.subscription?.plan.level ?? "-";
                const isBlocked = user.status === "BANNED";
                const isDeleted = user.status === "DELETED";
                const isUpdating =
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.id === user.id;

                return (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {user.profile.companyName}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_CLASS[plan] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[user.status] ?? ""}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-fit items-center justify-end gap-1">
                        <IconButton
                          aria-label="View user"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          title="View user"
                          onClick={() =>
                            navigate(
                              APP_ROUTES.admin.userDetail.replace(":id", String(user.id)),
                            )
                          }
                        >
                          <Eye size={14} />
                        </IconButton>
                        <IconButton
                          aria-label={isBlocked ? "Unblock user" : "Block user"}
                          variant="ghost"
                          color={isBlocked ? "neutral" : "error"}
                          size="sm"
                          title={isBlocked ? "Unblock user" : "Block user"}
                          disabled={isDeleted || isUpdating}
                          onClick={() => handleToggleBlock(user.id, isBlocked)}
                        >
                          {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
