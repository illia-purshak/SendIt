import { z } from "zod";
import { t } from "@/i18n/utils";

const emailSchema = z
  .string()
  .min(1, t("validation.emailRequired"))
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t("validation.validEmail"));

const passwordSchema = z
  .string()
  .min(6, t("validation.passwordMin"))
  .regex(/[A-Z]/, t("validation.passwordUppercase"))
  .regex(/[a-z]/, t("validation.passwordLowercase"))
  .regex(/\d/, t("validation.passwordDigit"));

export const loginSchema = z.object({
  email: z.string().min(1, t("validation.emailRequired")),
  password: z.string().min(1, t("validation.passwordRequired")),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const verify2faSchema = z.object({
  totpCode: z
    .string()
    .length(6, t("validation.codeSixDigits"))
    .regex(/^\d{6}$/, t("validation.codeSixDigits")),
});

export const organizationProfileSchema = z.object({
  companyName: z.string().min(1, t("validation.companyNameRequired")),
  edrpou: z.string().min(1, t("validation.edrpouRequired")),
  legalAddress: z.string().min(1, t("validation.legalAddressRequired")),
  companyNameLat: z.string(),
  taxNumber: z.string(),
  contactPersonName: z.string(),
});

export const acceptInviteSchema = z.object({
  firstName: z.string().min(1, t("validation.firstNameRequired")),
  lastName: z.string().min(1, t("validation.lastNameRequired")),
  password: passwordSchema,
});

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("validation.passwordsDoNotMatch"),
        path: ["confirmPassword"],
      });
    }
  });

export const passwordRules = [
  { test: (p: string) => p.length >= 6, label: t("validation.passwordRuleMin") },
  { test: (p: string) => /[A-Z]/.test(p), label: t("validation.passwordRuleUppercase") },
  { test: (p: string) => /[a-z]/.test(p), label: t("validation.passwordRuleLowercase") },
  { test: (p: string) => /\d/.test(p), label: t("validation.passwordRuleDigit") },
];
