import { useQuery } from "@tanstack/react-query";
import { apiClient, parseError } from "@/api/apiClient";
import { API_ROUTES } from "@/constants/api-routes";
import type { AnalyticsDashboard, AnalyticsPeriod, AnalyticsSummary } from "@/types/analytics";

class AnalyticsError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AnalyticsError";
    this.status = status;
  }
}

export function useAnalyticsQuery(period: AnalyticsPeriod) {
  return useQuery<AnalyticsSummary>({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsSummary>(
        API_ROUTES.analytics.summary,
        { params: { period } },
      );

      if (res.status >= 200 && res.status < 300) return res.data;
      throw new AnalyticsError(res.status, parseError(res.data));
    },
  });
}

export function useAnalyticsDashboardQuery() {
  return useQuery<AnalyticsDashboard>({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.get<AnalyticsDashboard>(
        API_ROUTES.analytics.dashboard,
      );

      if (res.status >= 200 && res.status < 300) return res.data;
      throw new AnalyticsError(res.status, parseError(res.data));
    },
  });
}
