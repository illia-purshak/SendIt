import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
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

export function useDeleteNovaPoshtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ttn: string) => {
      const res = await apiClient.delete<{ deletedAt: string }>(
        API_ROUTES.shipments.novaPoshtaDelete(ttn),
      )
      if (res.status === 200) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 422 && code === 'CONNECTION_INVALID') throw new ConnectionInvalidError()
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useCreateUkrposhtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateSimpleShipmentBody) => {
      const res = await apiClient.post<CreateSimpleShipmentResponse>(
        API_ROUTES.shipments.ukrposhtaCreate,
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteUkrposhtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ttn: string) => {
      const res = await apiClient.delete<{ deletedAt: string }>(
        API_ROUTES.shipments.ukrposhtaDelete(ttn),
      )
      if (res.status === 200) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useCreateMeestShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateSimpleShipmentBody) => {
      const res = await apiClient.post<CreateSimpleShipmentResponse>(
        API_ROUTES.shipments.meestCreate,
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteMeestShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ttn: string) => {
      const res = await apiClient.delete<{ deletedAt: string }>(
        API_ROUTES.shipments.meestDelete(ttn),
      )
      if (res.status === 200) return res.data
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useCreateNovaPoshtaShipmentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateNovaPoshtaShipmentBody) => {
      const res = await apiClient.post<CreateShipmentResponse>(
        API_ROUTES.shipments.novaPoshtaCreate,
        body,
      )
      if (res.status >= 200 && res.status < 300) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 422 && code === 'CONNECTION_INVALID') throw new ConnectionInvalidError()
      if (res.status === 503 && code === 'OPERATOR_UNAVAILABLE') throw new OperatorUnavailableError()
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
      throw new ShipmentError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
