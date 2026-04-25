export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Must be at least 6 characters'
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter'
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter'
  if (!/\d/.test(password)) return 'Must contain a digit'
  return null
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
  return null
}

export function validatePhone(phone: string): string | null {
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) return 'Use E.164 format, e.g. +380501234567'
  return null
}

export const passwordRules = [
  { test: (p: string) => p.length >= 6,    label: '6+ characters' },
  { test: (p: string) => /[A-Z]/.test(p),  label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p),  label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p),     label: 'Number' },
]
