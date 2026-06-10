import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApiClient, parseAdminError } from "@/api/adminApiClient";
import { API_ROUTES } from "@/constants/api-routes";

export interface AdminProfileSettings {
  language: string;
  timezone: string;
  dateFormat: string;
}

export interface AdminProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "SUPER_ADMIN";
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  settings: AdminProfileSettings;
}

export interface UpdateAdminSettingsBody {
  language?: string;
  timezone?: string;
  dateFormat?: string;
}

export const ADMIN_PROFILE_QUERY_KEY = ["admin", "profile"] as const;

export function useAdminProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ADMIN_PROFILE_QUERY_KEY,
    enabled,
    queryFn: async (): Promise<AdminProfileResponse> => {
      const res = await adminApiClient.get<AdminProfileResponse>(
        API_ROUTES.adminProfile.me,
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(parseAdminError(res.data));
      }

      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateAdminSettingsBody) => {
      const res = await adminApiClient.put<AdminProfileSettings>(
        API_ROUTES.adminProfile.settings,
        body,
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(parseAdminError(res.data));
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PROFILE_QUERY_KEY });
    },
  });
}
