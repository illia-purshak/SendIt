import axios, { type AxiosRequestConfig, type AxiosError } from "axios";
import { APP_ROUTES } from "@/constants/app-routes";
import { API_ROUTES } from "@/constants/api-routes";
import { t } from "@/i18n/utils";
import { adminTokenStore } from "@/store/adminTokenStore";
import { toastStore } from "@/store/toastStore";

const API_BASE_URL = `${(import.meta.env.API_BASE_URL ?? "").replace(/\/+$/, "")}/api/v1`;

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true,
});

adminApiClient.interceptors.request.use((config) => {
  const token = adminTokenStore.getToken() ?? adminTokenStore.getSetupToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

let adminRefreshing: Promise<string | null> | null = null;

export async function adminSilentRefresh(): Promise<string | null> {
  if (adminRefreshing) return adminRefreshing;

  const refreshToken = adminTokenStore.getRefreshToken();
  if (!refreshToken) return null;

  adminRefreshing = axios
    .post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}${API_ROUTES.adminAuth.refresh}`,
      { refreshToken },
    )
    .then((response) => {
      if (response.status < 200 || response.status >= 300) return null;
      const { accessToken, refreshToken: newRefresh } = response.data;
      if (!accessToken || !newRefresh) return null;
      adminTokenStore.setTokens(accessToken, newRefresh);
      return accessToken;
    })
    .catch(() => null)
    .finally(() => {
      adminRefreshing = null;
    });

  return adminRefreshing;
}

const ADMIN_AUTH_NO_REFRESH_URLS = new Set<string>([
  API_ROUTES.adminAuth.refresh,
  API_ROUTES.adminAuth.login,
  API_ROUTES.adminAuth.acceptInvite,
  API_ROUTES.adminAuth.verify2fa,
]);

adminApiClient.interceptors.response.use(async (response) => {
  const config = response.config as AxiosRequestConfig & { _retry?: boolean };

  if (
    response.status !== 401 ||
    config._retry ||
    ADMIN_AUTH_NO_REFRESH_URLS.has(config.url as string)
  ) {
    return response;
  }

  config._retry = true;
  const newToken = await adminSilentRefresh();

  if (!newToken) {
    adminTokenStore.clear();
    window.location.href = APP_ROUTES.admin.login;
    return response;
  }

  return adminApiClient.request(config);
});

adminApiClient.interceptors.response.use(null, (error: AxiosError) => {
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

export function parseAdminError(data: unknown): string {
  try {
    const body = data as {
      statusCode?: number;
      message?: string | string[];
      error?: string | { message?: string };
    };

    if (body.statusCode === 400 && Array.isArray(body.message)) {
      return body.message[0] ?? t("errors.validation");
    }

    if (typeof body.message === "string" && body.message) {
      return body.message;
    }

    if (typeof body.error === "object" && body.error?.message) {
      return body.error.message;
    }
  } catch {
    // ignore parse failure
  }

  return t("errors.unexpected");
}
