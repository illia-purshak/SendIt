import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { parseApiError, ApiValidationError } from '@/utils/parseApiError'
import { API_ROUTES } from '@/constants/api-routes'
import {
  ConnectionInvalidError,
  OperatorUnavailableError,
} from '@/api/postal-connections'
import type {
  ShipmentDetail,
  ShipmentPrefillDetail,
  ShipmentsResponse,
  ShipmentQueryParams,
  CreateNovaPoshtaShipmentBody,
  CreateShipmentResponse,
  CreateSimpleShipmentBody,
  CreateSimpleShipmentResponse,
  CreateShipmentBody,
  CreateShipmentOutput,
} from '@/types/shipment'

class ShipmentError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ShipmentError'
    this.status = status
  }
}

const LIST_KEY = ['shipments'] as const

export function useShipmentsQuery(params?: ShipmentQueryParams) {
  return useQuery<ShipmentsResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<ShipmentsResponse>(API_ROUTES.shipments.list, { params })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
  })
}

export function useShipmentDetailQuery(operator: string, ref: string) {
  return useQuery<ShipmentDetail>({
    queryKey: ['shipment', operator, ref],
    queryFn: async () => {
      const res = await apiClient.get<ShipmentDetail>(API_ROUTES.shipments.detail(operator, ref))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    enabled: Boolean(operator && ref),
  })
}

export function useShipmentByTtnQuery(ttn: string) {
  return useQuery<ShipmentPrefillDetail>({
    queryKey: ['shipment-by-ttn', ttn],
    queryFn: async () => {
      const res = await apiClient.get<ShipmentPrefillDetail>(
        API_ROUTES.shipments.detailByTtn(ttn),
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    enabled: Boolean(ttn),
  })
}

export function useCreateShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateShipmentBody): Promise<CreateShipmentOutput> => {
      const res = await apiClient.post<CreateShipmentOutput>(
        API_ROUTES.shipments.create,
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 422 && code === 'CONNECTION_INVALID') throw new ConnectionInvalidError()
      if (res.status === 503 && code === 'OPERATOR_UNAVAILABLE') throw new OperatorUnavailableError()
      if (res.status === 400 || res.status === 422) {
        const { message, validationDetails } = parseApiError(res.data)
        throw new ApiValidationError(res.status, message, validationDetails)
      }
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ operator, ref }: { operator: string; ref: string }) => {
      const res = await apiClient.delete<{ deletedAt: string }>(
        API_ROUTES.shipments.delete(operator, ref),
      )
      if (res.status === 200) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 422 && code === 'CONNECTION_INVALID') throw new ConnectionInvalidError()
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateNovaPoshtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ttn,
      body,
    }: {
      ttn: string
      body: CreateNovaPoshtaShipmentBody
    }) => {
      const res = await apiClient.put<CreateShipmentResponse>(
        API_ROUTES.shipments.novaPoshtaUpdate(ttn),
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 422 && code === 'CONNECTION_INVALID') {
        throw new ConnectionInvalidError()
      }
      if (res.status === 503 && code === 'OPERATOR_UNAVAILABLE') {
        throw new OperatorUnavailableError()
      }
      if (res.status === 400 || res.status === 422) {
        const { message, validationDetails } = parseApiError(res.data)
        throw new ApiValidationError(res.status, message, validationDetails)
      }
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateUkrposhtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ttn,
      body,
    }: {
      ttn: string
      body: CreateSimpleShipmentBody
    }) => {
      const res = await apiClient.put<CreateSimpleShipmentResponse>(
        API_ROUTES.shipments.ukrposhtaUpdate(ttn),
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 400 || res.status === 422) {
        const { message, validationDetails } = parseApiError(res.data)
        throw new ApiValidationError(res.status, message, validationDetails)
      }
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateMeestShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ttn,
      body,
    }: {
      ttn: string
      body: CreateSimpleShipmentBody
    }) => {
      const res = await apiClient.put<CreateSimpleShipmentResponse>(
        API_ROUTES.shipments.meestUpdate(ttn),
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 400 || res.status === 422) {
        const { message, validationDetails } = parseApiError(res.data)
        throw new ApiValidationError(res.status, message, validationDetails)
      }
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
