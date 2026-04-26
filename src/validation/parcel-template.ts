import { z } from 'zod'

const required = (msg: string) => z.string().min(1, msg)

const phoneField = required('Phone is required').regex(
  /^\+[1-9]\d{1,14}$/,
  'Use E.164 format, e.g. +380501234567',
)

export const parcelTemplateSchema = z.object({
  name: required('Template name is required'),
  description: z.string(),
  senderName: required('Sender name is required'),
  senderPhone: phoneField,
  senderAddress: required('Sender address is required'),
  senderCity: required('Sender city is required'),
  recipientName: required('Recipient name is required'),
  recipientPhone: phoneField,
  recipientAddress: required('Recipient address is required'),
  recipientCity: required('Recipient city is required'),
  payerType: z.enum(['SENDER', 'RECEIVER', 'THIRD_PARTY']),
  isDefault: z.boolean(),
})

export type ParcelTemplateFormValues = z.infer<typeof parcelTemplateSchema>
