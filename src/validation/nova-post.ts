import { z } from 'zod'

export const sandboxConnectSchema = z.object({
  phone: z
    .string()
    .regex(/^\d+$/, 'Phone must contain digits only (no +, spaces, or dashes)')
    .min(9, 'Phone number is too short')
    .max(15, 'Phone number is too long'),
})

export const productionConnectSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
})
