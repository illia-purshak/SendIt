import { t } from "@/i18n/utils";

export function validatePassword(password: string): string | null {
  if (password.length < 6) return t("validation.passwordMin");
  if (!/[A-Z]/.test(password)) return t("validation.passwordUppercase");
  if (!/[a-z]/.test(password)) return t("validation.passwordLowercase");
  if (!/\d/.test(password)) return t("validation.passwordDigit");
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t("validation.validEmail");
  return null;
}

export function normalizeUaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("380") && digits.length === 12) return digits;
  if (digits.startsWith("80") && digits.length === 11) return `3${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `38${digits}`;

  return digits;
}

export function isValidUaPhone(phone: string): boolean {
  return /^380\d{9}$/.test(normalizeUaPhone(phone));
}

export function isValidInternationalPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function validatePhone(phone: string): string | null {
  if (!isValidUaPhone(phone)) return t("validation.phoneE164");
  return null;
}

export const passwordRules = [
  { test: (p: string) => p.length >= 6, label: t("validation.passwordRuleMin") },
  { test: (p: string) => /[A-Z]/.test(p), label: t("validation.passwordRuleUppercase") },
  { test: (p: string) => /[a-z]/.test(p), label: t("validation.passwordRuleLowercase") },
  { test: (p: string) => /\d/.test(p), label: t("validation.passwordRuleDigit") },
];
