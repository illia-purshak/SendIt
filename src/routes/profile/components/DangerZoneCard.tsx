import { useTranslation } from "react-i18next";
import { useDeleteAccountMutation } from "@/api/auth";
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
import { useAuth } from "@/hooks/useAuth";

export function DangerZoneCard() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { mutateAsync: deleteAccount, isPending } = useDeleteAccountMutation();
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteAccount();
      logout();
    } catch (error) {
      toast({
        title: t("profile.deleteScheduleFailed"),
        description:
          error instanceof Error ? error.message : t("profile.somethingWentWrong"),
        color: "error",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-red-700">
        {t("profile.dangerZoneTitle")}
      </h2>
      <p className="mb-4 text-sm text-neutral-600">
        {t("profile.dangerZoneSubtitle")}
      </p>
      <AlertDialog color="error">
        <AlertDialogTrigger asChild>
          <Button variant="outline" color="error" disabled={isPending}>
            {isPending ? t("profile.deleting") : t("profile.deleteAccount")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>
            {t("profile.deleteAccountConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("profile.deleteAccountConfirmDescription")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("profile.deleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
