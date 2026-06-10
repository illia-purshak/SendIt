import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { authStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { verify2faSchema } from "@/validation/auth";
import type { z } from "zod";

type Verify2faValues = z.infer<typeof verify2faSchema>;

export default function Verify2faPage() {
  const { t } = useTranslation();
  const { verify2fa } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const pendingToken = authStore.getPendingToken();

  useEffect(() => {
    if (!pendingToken) {
      navigate(APP_ROUTES.login, { replace: true });
    }
  }, [pendingToken, navigate]);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Verify2faValues>({
    resolver: zodResolver(verify2faSchema),
    defaultValues: { totpCode: "" },
  });

  async function onSubmit(values: Verify2faValues) {
    if (!pendingToken) return;
    setError(null);
    const err = await verify2fa(pendingToken, values.totpCode);
    if (err) {
      setError(err);
    } else {
      navigate(APP_ROUTES.dashboard, { replace: true });
    }
  }

  if (!pendingToken) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{t("auth.verify2fa")}</h1>
        <p className="mb-6 text-sm text-neutral-500">
          {t("auth.verify2faDescription")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="totpCode"
            render={({ field, fieldState }) => (
              <Input
                label={t("auth.authenticationCode")}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
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

          <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("auth.verify")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <button
            type="button"
            className="font-medium text-teal-700 hover:underline"
            onClick={() => navigate(APP_ROUTES.login)}
          >
            {t("auth.backToSignIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
