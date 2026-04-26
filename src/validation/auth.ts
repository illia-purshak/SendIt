import { z } from 'zod'

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

const passwordSchema = z
  .string()
  .min(6, 'Must be at least 6 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/\d/, 'Must contain a digit')

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  email: emailSchema,
  phone: z
    .string()
    .refine((v) => !v || /^\+[1-9]\d{1,14}$/.test(v), 'Use E.164 format, e.g. +380501234567'),
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
})

export const individualProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string(),
  firstNameLat: z.string(),
  lastNameLat: z.string(),
  birthDate: z.date().optional(),
})

export const organizationProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  edrpou: z.string().min(1, 'EDRPOU is required'),
  legalAddress: z.string().min(1, 'Legal address is required'),
  companyNameLat: z.string(),
  taxNumber: z.string(),
  contactPersonName: z.string(),
})

export const passwordRules = [
  { test: (p: string) => p.length >= 6, label: '6+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'Number' },
]
