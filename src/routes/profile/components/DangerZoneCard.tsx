import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast/use-toast";
import { useDeleteAccountMutation } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";

export function DangerZoneCard() {
  const { logout } = useAuth();
  const { mutateAsync: deleteAccount, isPending } = useDeleteAccountMutation();
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteAccount();
      logout();
    } catch (error) {
      toast({
        title: "Failed to schedule deletion",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        color: "error",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-red-700">Danger zone</h2>
      <p className="mb-4 text-sm text-neutral-600">
        Deleting your account schedules its removal in 30 days. You can cancel
        within that window by logging back in.
      </p>
      <AlertDialog color="error">
        <AlertDialogTrigger asChild>
          <Button variant="outline" color="error" disabled={isPending}>
            {isPending ? "Deleting..." : "Delete account"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription>
            Your account will be scheduled for deletion in 30 days. You may
            recover it by logging back in within that window.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
