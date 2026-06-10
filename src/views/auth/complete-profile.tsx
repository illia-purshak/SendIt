import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES } from "@/constants/app-routes";
import { organizationProfileSchema } from "@/validation/auth";
import type { z } from "zod";

type OrgValues = z.infer<typeof organizationProfileSchema>;

export default function CompleteProfilePage() {
  const { t } = useTranslation();
  const { completeOrganizationProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<OrgValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      companyName: "",
      edrpou: "",
      legalAddress: "",
      companyNameLat: "",
      taxNumber: "",
      contactPersonName: "",
    },
  });

  function handleCancel() {
    navigate(APP_ROUTES.login);
  }

  async function onSubmit(values: OrgValues) {
    setError(null);
    const err = await completeOrganizationProfile({
      companyName: values.companyName,
      edrpou: values.edrpou,
      legalAddress: values.legalAddress,
      companyNameLat: values.companyNameLat || null,
      taxNumber: values.taxNumber || null,
      contactPersonName: values.contactPersonName || null,
    });
    if (err) {
      setError(err);
    } else {
      navigate(APP_ROUTES.dashboard);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{t("auth.completeProfile")}</h1>
        <p className="mb-6 text-sm text-neutral-500">{t("auth.completeProfileDescription")}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Controller
                control={control}
                name="companyName"
                render={({ field, fieldState }) => (
                  <Input
                    label={t("auth.companyName")}
                    placeholder="Acme Corp"
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
            <Controller
              control={control}
              name="edrpou"
              render={({ field, fieldState }) => (
                <Input
                  label={t("auth.edrpou")}
                  placeholder="12345678"
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
              name="taxNumber"
              render={({ field }) => (
                <Input
                  label={t("auth.taxNumberOptional")}
                  placeholder="1234567890"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  color="teal"
                />
              )}
            />
            <div className="col-span-2">
              <Controller
                control={control}
                name="legalAddress"
                render={({ field, fieldState }) => (
                  <Input
                    label={t("auth.legalAddress")}
                    placeholder="1 Main St, Kyiv, Ukraine"
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
            <div className="col-span-2">
              <Controller
                control={control}
                name="companyNameLat"
                render={({ field }) => (
                  <Input
                    label={t("auth.companyNameLatinOptional")}
                    placeholder="Acme Corp"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="teal"
                  />
                )}
              />
            </div>
            <div className="col-span-2">
              <Controller
                control={control}
                name="contactPersonName"
                render={({ field }) => (
                  <Input
                    label={t("auth.contactPersonOptional")}
                    placeholder="John Doe"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="teal"
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-1 flex gap-3">
            <Button
              type="button"
              variant="outline"
              color="neutral"
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" color="teal" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("auth.saveAndContinue")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
