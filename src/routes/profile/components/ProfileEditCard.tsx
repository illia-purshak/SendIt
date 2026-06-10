import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateProfileMutation } from "@/api/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { OrganizationProfile } from "@/types/auth";
import { useProfileRouteData } from "../useProfileRouteData";
import { InfoRow } from "./InfoRow";

export function ProfileEditCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data } = useProfileRouteData();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfileMutation();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    companyNameLat: "",
    ownershipForm: "",
    legalAddress: "",
    contactPersonName: "",
    taxNumber: "",
    phone: "",
  });

  const organizationProfile: OrganizationProfile | null = data?.profile ?? null;
  const identifier = user?.email ?? user?.phone ?? "";

  function handleEditStart() {
    setForm({
      companyName: organizationProfile?.companyName ?? "",
      companyNameLat: organizationProfile?.companyNameLat ?? "",
      ownershipForm: organizationProfile?.ownershipForm ?? "",
      legalAddress: organizationProfile?.legalAddress ?? "",
      contactPersonName: organizationProfile?.contactPersonName ?? "",
      taxNumber: organizationProfile?.taxNumber ?? "",
      phone: data?.phone ?? user?.phone ?? "",
    });
    setIsEditing(true);
  }

  async function handleSave() {
    try {
      await updateProfile({
        companyName: form.companyName || undefined,
        companyNameLat: form.companyNameLat || undefined,
        ownershipForm: form.ownershipForm || undefined,
        legalAddress: form.legalAddress || undefined,
        contactPersonName: form.contactPersonName || undefined,
        taxNumber: form.taxNumber || undefined,
        phone: form.phone || undefined,
      });
      toast({ title: t("profile.profileUpdated"), color: "success" });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: t("profile.profileSaveFailed"),
        description:
          error instanceof Error ? error.message : t("profile.somethingWentWrong"),
        color: "error",
      });
    }
  }

  if (!isEditing) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {t("layout.profile")}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {t("profile.profileSubtitle")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            color="neutral"
            onClick={handleEditStart}
          >
            {t("profile.edit")}
          </Button>
        </div>
        <dl className="divide-y divide-neutral-100">
          <InfoRow label={t("profile.account")} value={identifier} />
          {organizationProfile && (
            <>
              <InfoRow
                label={t("profile.company")}
                value={organizationProfile.companyName}
              />
              <InfoRow label={t("profile.edrpou")} value={organizationProfile.edrpou} />
              <InfoRow
                label={t("profile.legalAddress")}
                value={organizationProfile.legalAddress}
              />
              {organizationProfile.contactPersonName && (
                <InfoRow
                  label={t("profile.contactPerson")}
                  value={organizationProfile.contactPersonName}
                />
              )}
            </>
          )}
          {data?.phone && <InfoRow label={t("profile.phone")} value={data.phone} />}
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("layout.profile")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("profile.profileSubtitle")}
        </p>
      </div>
      <div className="mb-4">
        <dl className="divide-y divide-neutral-100">
          <InfoRow label={t("profile.account")} value={identifier} />
          {organizationProfile && (
            <InfoRow label={t("profile.edrpou")} value={organizationProfile.edrpou} />
          )}
        </dl>
      </div>
      <div className="flex flex-col gap-3">
        <Input
          label={t("auth.companyName")}
          value={form.companyName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              companyName: event.target.value,
            }))
          }
          color="teal"
          required
        />
        <Input
          label={t("profile.companyNameLatin")}
          value={form.companyNameLat}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              companyNameLat: event.target.value,
            }))
          }
          color="teal"
        />
        <Input
          label={t("profile.ownershipForm")}
          value={form.ownershipForm}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              ownershipForm: event.target.value,
            }))
          }
          color="teal"
        />
        <Input
          label={t("profile.legalAddress")}
          value={form.legalAddress}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              legalAddress: event.target.value,
            }))
          }
          color="teal"
          required
        />
        <Input
          label={t("profile.contactPerson")}
          value={form.contactPersonName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              contactPersonName: event.target.value,
            }))
          }
          color="teal"
        />
        <Input
          label={t("profile.taxNumber")}
          value={form.taxNumber}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              taxNumber: event.target.value,
            }))
          }
          color="teal"
        />
        <Input
          label={t("profile.phone")}
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          color="teal"
        />
        <div className="mt-1 flex gap-2">
          <Button color="teal" disabled={isPending} onClick={handleSave}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
          <Button
            variant="outline"
            color="neutral"
            onClick={() => setIsEditing(false)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
