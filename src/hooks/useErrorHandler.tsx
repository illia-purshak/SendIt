import { AxiosError } from "axios";
import { useAuth } from "./useAuth";
import { toastStore } from "@/store/toastStore";

export const useErrorHandler = () => {
  const { logout } = useAuth();

  const isAxiosError = (
    error: unknown,
  ): error is AxiosError<{ message?: string }> =>
    (error as AxiosError)?.isAxiosError === true;

  const errorHandler = (error: unknown) => {
    let message = "Something went wrong";

    if (isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        logout();
        toastStore.toast({ title: "Session expired. Please log in again.", color: "error" });
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
