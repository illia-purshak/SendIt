import { useState } from "react";
import { useUpdateProfileMutation } from "@/api/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { OrganizationProfile } from "@/types/auth";
import { useProfileRouteData } from "../useProfileRouteData";
import { InfoRow } from "./InfoRow";

export function ProfileEditCard() {
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
      toast({ title: "Profile updated", color: "success" });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Failed to save",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        color: "error",
      });
    }
  }

  if (!isEditing) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
          <Button
            size="sm"
            variant="outline"
            color="neutral"
            onClick={handleEditStart}
          >
            Edit
          </Button>
        </div>
        <dl className="divide-y divide-neutral-100">
          <InfoRow label="Account" value={identifier} />
          {organizationProfile && (
            <>
              <InfoRow label="Company" value={organizationProfile.companyName} />
              <InfoRow label="EDRPOU" value={organizationProfile.edrpou} />
              <InfoRow
                label="Legal address"
                value={organizationProfile.legalAddress}
              />
              {organizationProfile.contactPersonName && (
                <InfoRow
                  label="Contact person"
                  value={organizationProfile.contactPersonName}
                />
              )}
            </>
          )}
          {data?.phone && <InfoRow label="Phone" value={data.phone} />}
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">Profile</h2>
      <div className="mb-4">
        <dl className="divide-y divide-neutral-100">
          <InfoRow label="Account" value={identifier} />
          {organizationProfile && (
            <InfoRow label="EDRPOU" value={organizationProfile.edrpou} />
          )}
        </dl>
      </div>
      <div className="flex flex-col gap-3">
        <Input
          label="Company name"
          value={form.companyName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              companyName: event.target.value,
            }))
          }
          color="green"
          required
        />
        <Input
          label="Company name (Latin)"
          value={form.companyNameLat}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              companyNameLat: event.target.value,
            }))
          }
          color="green"
        />
        <Input
          label="Ownership form"
          value={form.ownershipForm}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              ownershipForm: event.target.value,
            }))
          }
          color="green"
        />
        <Input
          label="Legal address"
          value={form.legalAddress}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              legalAddress: event.target.value,
            }))
          }
          color="green"
          required
        />
        <Input
          label="Contact person"
          value={form.contactPersonName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              contactPersonName: event.target.value,
            }))
          }
          color="green"
        />
        <Input
          label="Tax number"
          value={form.taxNumber}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              taxNumber: event.target.value,
            }))
          }
          color="green"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          color="green"
        />
        <div className="mt-1 flex gap-2">
          <Button color="green" disabled={isPending} onClick={handleSave}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            color="neutral"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
