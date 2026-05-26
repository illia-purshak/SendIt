export type AnalyticsPeriod = "week" | "month" | "year";

export type AnalyticsPoint = { label: string; count: number };
export type AnalyticsOperatorEntry = { name: string; count: number };

export type AnalyticsSummary = {
  totalShipments: number;
  shipmentsChange: number;
  totalSpend: number;
  spendChange: number;
  avgCost: number;
  avgCostChange: number;
  byOperator: AnalyticsOperatorEntry[];
  monthly: AnalyticsPoint[];
};
