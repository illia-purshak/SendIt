import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAdminLoginMutation } from "@/api/admin-auth";
import { useToast } from "@/components/Toast/use-toast";
import { ApiValidationError } from "@/utils/parseApiError";
import { loginSchema } from "@/validation/auth";

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const adminLoginMutation = useAdminLoginMutation();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      const result = await adminLoginMutation.mutateAsync({ email: values.email, password: values.password });
      if ("requiresSetup" in result && result.requiresSetup) {
        navigate(APP_ROUTES.admin.setup2fa, { replace: true });
      } else if ("requires2FA" in result && result.requires2FA) {
        navigate(APP_ROUTES.admin.verify2fa, { replace: true });
      } else {
        navigate(APP_ROUTES.admin.dashboard, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiValidationError && err.validationDetails.length > 0) {
        toast({ title: err.message, description: err.validationDetails.join('\n'), color: "error" });
      } else {
        toast({ title: err instanceof Error ? err.message : t("errors.unexpected"), color: "error" });
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{t("adminAuth.signInTitle")}</h1>
        <p className="mb-6 text-sm text-neutral-500">{t("adminAuth.signInDescription")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label={t("common.email")}
                type="email"
                placeholder="admin@example.com"
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
            )}
          />

          <Button type="submit" color="teal" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
