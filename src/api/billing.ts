import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, parseError } from "@/api/apiClient";
import { API_ROUTES } from "@/constants/api-routes";
import type { BillingHistoryResponse } from "@/types/billing";
import type { PaymentCard } from "@/types/subscription";

class BillingError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class CardAlreadyExistsError extends Error {
  constructor() {
    super("Card already exists — use update instead");
    this.name = "CardAlreadyExistsError";
  }
}

type CardPayload = {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
};

const CARD_KEY = ["billing", "card"] as const;

export function useBillingHistoryQuery(page: number) {
  return useQuery<BillingHistoryResponse>({
    queryKey: ["billing", "list", page],
    queryFn: async () => {
      const res = await apiClient.get<BillingHistoryResponse>(
        API_ROUTES.billing.list,
        { params: { page, limit: 10 }, validateStatus: () => true },
      );
      if (res.status >= 200 && res.status < 300) return res.data;
      throw new BillingError(res.status, parseError(res.data));
    },
  });
}

export function useCardQuery() {
  return useQuery<PaymentCard | null>({
    queryKey: CARD_KEY,
    queryFn: async () => {
      const res = await apiClient.get<PaymentCard>(API_ROUTES.billing.card, {
        validateStatus: () => true,
      });
      if (res.status === 404) return null;
      if (res.status >= 200 && res.status < 300) return res.data;
      throw new BillingError(res.status, parseError(res.data));
    },
  });
}

export function useSaveCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: CardPayload) => {
      const res = await apiClient.post<PaymentCard>(
        API_ROUTES.billing.card,
        card,
        { validateStatus: () => true },
      );
      if (res.status >= 200 && res.status < 300) return res.data;
      if (res.status === 409) throw new CardAlreadyExistsError();
      throw new BillingError(res.status, parseError(res.data));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CARD_KEY }),
  });
}

export function useUpdateCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: CardPayload) => {
      const res = await apiClient.put<PaymentCard>(
        API_ROUTES.billing.card,
        card,
        { validateStatus: () => true },
      );
      if (res.status >= 200 && res.status < 300) return res.data;
      throw new BillingError(res.status, parseError(res.data));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CARD_KEY }),
  });
}

export function useDeleteCardMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(API_ROUTES.billing.card, {
        validateStatus: () => true,
      });
      if (res.status === 204) return;
      throw new BillingError(res.status, parseError(res.data));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CARD_KEY }),
  });
}
