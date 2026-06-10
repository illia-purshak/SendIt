import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAuth } from "@/hooks/useAuth";
import { forgotPasswordSchema } from "@/validation/auth";
import type { z } from "zod";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setError(null);
    const err = await forgotPassword(values.email);
    if (err) {
      setError(err);
      return;
    }
    setSubmittedEmail(values.email);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        {sent ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-xl text-teal-700">
              ✓
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-neutral-900">{t("auth.checkYourEmail")}</h1>
            <p className="mb-6 text-sm text-neutral-500">
              {t("auth.checkYourEmailDescription", { email: submittedEmail })}
            </p>
            <Link to={APP_ROUTES.login} className="text-sm font-medium text-teal-700 hover:underline">
              {t("auth.backToSignIn")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{t("auth.forgotPasswordTitle")}</h1>
            <p className="mb-6 text-sm text-neutral-500">
              {t("auth.forgotPasswordDescription")}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label={t("common.email")}
                    type="email"
                    placeholder="you@example.com"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="teal"
                    error={fieldState.error?.message}
                    required
                  />
                )}
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <Button type="submit" color="teal" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-500">
              <Link to={APP_ROUTES.login} className="font-medium text-teal-700 hover:underline">
                {t("auth.backToSignIn")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
