import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation, type Location } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast/use-toast";
import { loginSchema } from "@/validation/auth";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? APP_ROUTES.dashboard;

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const result = await login(values.email, values.password);
    if (typeof result === "string") {
      toast({ title: result, color: "error" });
    } else if (result && "requires2FA" in result) {
      navigate(APP_ROUTES.verify2fa);
    } else if (result && "requiresProfileCompletion" in result) {
      navigate(APP_ROUTES.completeProfile);
    } else {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{t("auth.signIn")}</h1>
        <p className="mb-6 text-sm text-neutral-500">{t("auth.welcomeBack")}</p>

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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">{t("common.password")}</span>
              <Link to={APP_ROUTES.forgotPassword} className="text-xs text-teal-700 hover:underline">
                {t("auth.forgotPasswordLink")}
              </Link>
            </div>
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="teal"
                  error={fieldState.error?.message}
                  required
                />
              )}
            />
          </div>

          <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {t("auth.dontHaveAccount")}{" "}
          <Link to={APP_ROUTES.register} className="font-medium text-teal-700 hover:underline">
            {t("auth.createOne")}
          </Link>
        </p>
      </div>
    </div>
  );
}
