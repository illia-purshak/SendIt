import { z } from 'zod'

export const requestKeySchema = z.object({
  phone: z.string().regex(/^\d{9,15}$/, 'Enter 9–15 digits, no spaces or + prefix'),
})

export const connectOperatorSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
})
