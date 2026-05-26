import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, passwordRules } from "@/validation/auth";
import type z from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
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
          Create account
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Join SendIt — register your organization
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                color="green"
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
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="green"
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
                            ? "text-green-700"
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
            color="green"
            className="mt-1 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            to={APP_ROUTES.login}
            className="font-medium text-green-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
