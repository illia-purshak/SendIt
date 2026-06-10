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

export type ShipmentStatus =
  | "DRAFT"
  | "CREATED"
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "UNKNOWN";

export type ConnectionStatus = "ACTIVE" | "BLOCKED" | "INVALID";

export type DashboardConnection = {
  slug: string;
  name: string;
  logoUrl: string | null;
  status: ConnectionStatus;
};

export type DashboardShipments = {
  total: number;
  byOperator: { ukrposhta: number; meest: number; nova_post: number };
  byStatus: Partial<Record<ShipmentStatus, number>>;
  deliverySuccessRate: number;
  trend: { date: string; count: number }[];
};

export type DashboardAccount = {
  templatesCount: number;
  draftsCount: number;
  connections: DashboardConnection[];
};

export type DashboardBilling = {
  currentPlan: { name: string; level: number; periodEnd: string | null } | null;
  totalSpent: number;
  monthlySpend: { month: string; amount: number }[];
};

export type AnalyticsDashboard = {
  shipments: DashboardShipments;
  account: DashboardAccount;
  billing: DashboardBilling;
};
