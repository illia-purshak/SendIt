import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, passwordRules } from "@/validation/auth";
import type z from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: RegisterValues) {
    setError(null);
    const err = await registerUser(values.email, values.password);
    if (err) {
      setError(err);
    } else {
      navigate(APP_ROUTES.completeProfile);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
          {t("auth.createAccount")}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {t("auth.joinOrganization")}
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

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Input
                  label={t("common.password")}
                  type="password"
                  placeholder="••••••••"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="teal"
                  error={fieldState.error?.message}
                  required
                />
                {password && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    {passwordRules.map((rule) => (
                      <span
                        key={rule.label}
                        className={[
                          "flex items-center gap-1 text-xs",
                          rule.test(password)
                            ? "text-teal-700"
                            : "text-neutral-400",
                        ].join(" ")}
                      >
                        <span>{rule.test(password) ? "✓" : "○"}</span>
                        {rule.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            type="submit"
            color="teal"
            className="mt-1 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            to={APP_ROUTES.login}
            className="font-medium text-teal-700 hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
