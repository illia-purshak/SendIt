import { AxiosError } from "axios";
import { t } from "@/i18n/utils";
import { useAuth } from "./useAuth";
import { toastStore } from "@/store/toastStore";

export const useErrorHandler = () => {
  const { logout } = useAuth();

  const isAxiosError = (
    error: unknown,
  ): error is AxiosError<{ message?: string }> =>
    (error as AxiosError)?.isAxiosError === true;

  const errorHandler = (error: unknown) => {
    let message = t("profile.somethingWentWrong");

    if (isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        logout();
        toastStore.toast({ title: t("errors.sessionExpiredLoginAgain"), color: "error" });
        return;
      }

      message = error.response?.data?.message ?? message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    toastStore.toast({ title: message, color: "error" });
  };

  return { errorHandler };
};
