import axios, { type AxiosRequestConfig, type AxiosError } from "axios";
import { APP_ROUTES } from "@/constants/app-routes";
import { API_ROUTES } from "@/constants/api-routes";
import { t } from "@/i18n/utils";
import { authStore } from "@/store/authStore";
import { toastStore } from "@/store/toastStore";
import type { ApiErrorResponse } from "@/types/api-error";

const API_BASE_URL = `${(import.meta.env.API_BASE_URL ?? "").replace(/\/+$/, "")}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true,
});

apiClient.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

export async function silentRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;

  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return null;

  refreshing = axios
    .post<{ accessToken: string; refreshToken: string; currentPlan?: import("@/types/subscription").CurrentPlan; scheduledPlan?: import("@/types/subscription").ScheduledPlan | null }>(
      `${API_BASE_URL}${API_ROUTES.auth.refresh}`,
      { refreshToken },
    )
    .then((response) => {
      if (response.status < 200 || response.status >= 300) return null;
      const { accessToken, refreshToken: newRefresh } = response.data;
      if (!accessToken || !newRefresh) return null;
      authStore.setTokens(accessToken, newRefresh);
      if (response.data.currentPlan) {
        authStore.setCurrentPlan(response.data.currentPlan, response.data.scheduledPlan ?? null);
      }
      return accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

const AUTH_NO_REFRESH_URLS = new Set<string>([
  API_ROUTES.auth.refresh,
  API_ROUTES.auth.login,
  API_ROUTES.auth.register,
  API_ROUTES.auth.twoFactor.verify,
  API_ROUTES.auth.completeProfile,
]);

apiClient.interceptors.response.use(async (response) => {
  const config = response.config as AxiosRequestConfig & { _retry?: boolean };

  const responseCode = (response.data as { code?: string } | null)?.code;
  if (responseCode === "CONNECTION_INVALID") {
    toastStore.toast({
      title: t("errors.connectionInvalidTitle"),
      description: t("errors.connectionInvalidDescription"),
      color: "warning",
    });
  }

  if (
    response.status !== 401 ||
    config._retry ||
    AUTH_NO_REFRESH_URLS.has(config.url as string)
  ) {
    return response;
  }

  config._retry = true;
  const newToken = await silentRefresh();

  if (!newToken) {
    authStore.clear();
    window.location.href = APP_ROUTES.login;
    return response;
  }

  return apiClient.request(config);
});

apiClient.interceptors.response.use(null, (error: AxiosError) => {
  if (axios.isCancel(error)) return Promise.reject(error);

  let message = t("errors.unexpected");

  if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
    message = t("errors.requestTimedOut");
  } else if (!error.response) {
    message = t("errors.network");
  }

  toastStore.toast({ title: t("common.error"), description: message, color: "error" });
  return Promise.reject(new Error(message));
});

export async function fetcher<T = unknown>(path: string) {
  return apiClient.get<T>(path);
}

export function parseError(data: unknown): string {
  try {
    const body = data as Partial<ApiErrorResponse>;
    if (typeof body.message === "string" && body.message) return body.message;
  } catch {
    // ignore parse failure
  }

  return t("errors.unexpected");
}
