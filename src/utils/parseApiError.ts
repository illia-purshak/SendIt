import type { ApiErrorResponse } from '@/types/api-error'
import { t } from '@/i18n/utils'

export class ApiValidationError extends Error {
  status: number
  validationDetails: string[]

  constructor(status: number, message: string, validationDetails: string[] = []) {
    super(message)
    this.name = 'ApiValidationError'
    this.status = status
    this.validationDetails = validationDetails
  }
}

function toLabel(field: string): string {
  return field
    .replace(/\./g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase())
}

export function parseApiError(data: unknown): { message: string; validationDetails: string[] } {
  try {
    const body = data as Partial<ApiErrorResponse>
    const message =
      typeof body.message === 'string' && body.message ? body.message : t('errors.unexpected')
    const validationDetails: string[] = []

    if (body.details?.fields) {
      for (const [field, messages] of Object.entries(body.details.fields)) {
        const label = toLabel(field)
        for (const msg of messages) {
          validationDetails.push(`${label}: ${msg}`)
        }
      }
    }

    return { message, validationDetails }
  } catch {
    return { message: t('errors.unexpected'), validationDetails: [] }
  }
}
