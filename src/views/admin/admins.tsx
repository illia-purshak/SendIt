import { useState } from "react";
import { Lock, Send, Trash2, Unlock } from "lucide-react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Loader/Spinner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/AlertDialog";
import {
  useAdminMembersQuery,
  useAdminInviteMutation,
  useAdminUpdateMemberMutation,
  useAdminDeleteMemberMutation,
  useAdminResendInviteMutation,
  AdminInviteConflictError,
} from "@/api/admin-admins";
import { toastStore } from "@/store/toastStore";
import type { AdminMemberStatus } from "@/types/admin-admin";

const STATUS_CLASS: Record<AdminMemberStatus, string> = {
  ACTIVE: "bg-teal-100 text-teal-800",
  INACTIVE: "bg-neutral-100 text-neutral-500",
  PENDING: "bg-yellow-100 text-yellow-700",
  DELETED: "bg-red-100 text-red-700",
};

export default function AdminAdminsPage() {
  const { data, isLoading, error } = useAdminMembersQuery();
  const inviteMutation = useAdminInviteMutation();
  const updateMutation = useAdminUpdateMemberMutation();
  const deleteMutation = useAdminDeleteMemberMutation();
  const resendMutation = useAdminResendInviteMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const admins = data?.items ?? [];

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    try {
      const result = await inviteMutation.mutateAsync({ email: inviteEmail.trim() });
      setInviteEmail("");
      setInviteUrl(result.inviteUrl);
      toastStore.toast({ title: "Invite created", color: "success" });
    } catch (err) {
      const message =
        err instanceof AdminInviteConflictError
          ? "An active invite for this email already exists."
          : err instanceof Error
            ? err.message
            : "Failed to send invite";
      toastStore.toast({ title: "Error", description: message, color: "error" });
    }
  }

  function handleInviteClose() {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteUrl(null);
  }

  async function handleToggleStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMutation.mutateAsync({ id, status: newStatus });
      toastStore.toast({
        title: newStatus === "ACTIVE" ? "Admin activated" : "Admin deactivated",
        color: "success",
      });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update",
        color: "error",
      });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      toastStore.toast({ title: "Admin removed", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        color: "error",
      });
    } finally {
      setDeleteConfirmId(null);
    }
  }

  async function handleResendInvite(id: number) {
    try {
      await resendMutation.mutateAsync(id);
      toastStore.toast({ title: "Invite resent", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resend invite",
        color: "error",
      });
    }
  }

  return (
    <main className="py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Admins</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage platform administrators. Only super admins can invite or remove admins.
          </p>
        </div>
        <Button color="teal" onClick={() => setInviteOpen(true)}>
          Invite admin
        </Button>
      </div>

      <AlertDialog open={inviteOpen} onOpenChange={(open) => !open && handleInviteClose()}>
        <AlertDialogContent>
          <AlertDialogTitle>Invite admin</AlertDialogTitle>

          {inviteUrl ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-neutral-600">
                Invite created. Share this link with the new admin:
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-neutral-700">
                  {inviteUrl}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-teal-700 transition-colors hover:text-teal-900"
                  onClick={() => navigator.clipboard.writeText(inviteUrl)}
                >
                  Copy
                </button>
              </div>
              <AlertDialogFooter>
                <Button color="teal" onClick={handleInviteClose}>
                  Done
                </Button>
              </AlertDialogFooter>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="newadmin@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                color="teal"
                required
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleInviteClose}>Cancel</AlertDialogCancel>
                <Button
                  color="teal"
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                >
                  {inviteMutation.isPending ? "Sending..." : "Send invite"}
                </Button>
              </AlertDialogFooter>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        color="error"
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove admin?</AlertDialogTitle>
          <p className="mt-2 text-sm text-neutral-600">
            This will revoke all their sessions. This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
            <Button
              color="error"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <p className="py-10 text-center text-sm text-red-500">Failed to load admins.</p>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Invited by</Th>
                <Th>Created at</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isResending =
                  resendMutation.isPending && resendMutation.variables === admin.id;
                const isUpdating =
                  updateMutation.isPending && updateMutation.variables?.id === admin.id;

                return (
                  <tr
                    key={admin.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[admin.status] ?? ""}`}
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {admin.invitedBy?.email ?? <span className="text-neutral-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-fit items-center justify-end gap-1">
                        {admin.status === "PENDING" && (
                          <IconButton
                            aria-label="Resend invite"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            title={isResending ? "Resending invite" : "Resend invite"}
                            disabled={isResending}
                            onClick={() => handleResendInvite(admin.id)}
                          >
                            <Send size={14} />
                          </IconButton>
                        )}
                        {admin.status === "DELETED" && (
                          <IconButton
                            aria-label="Invite again"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            title="Invite again"
                            onClick={() => { setInviteEmail(admin.email); setInviteOpen(true); }}
                          >
                            <Send size={14} />
                          </IconButton>
                        )}
                        {(admin.status === "ACTIVE" || admin.status === "INACTIVE") && (
                          <IconButton
                            aria-label={
                              admin.status === "ACTIVE" ? "Deactivate admin" : "Activate admin"
                            }
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            title={
                              admin.status === "ACTIVE" ? "Deactivate admin" : "Activate admin"
                            }
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(admin.id, admin.status)}
                          >
                            {admin.status === "ACTIVE" ? (
                              <Lock size={14} />
                            ) : (
                              <Unlock size={14} />
                            )}
                          </IconButton>
                        )}
                        {admin.status !== "DELETED" && (
                          <IconButton
                            aria-label="Delete admin"
                            variant="ghost"
                            color="error"
                            size="sm"
                            title="Delete admin"
                            onClick={() => setDeleteConfirmId(admin.id)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">
                    No admins found.
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
