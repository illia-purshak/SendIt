import { type ReactElement, useState } from "react";
import { usePostalConnectionsQuery } from "@/api/postal-connections";
import { useMySubscriptionQuery } from "@/api/subscriptions";
import { DangerZoneCard } from "./components/DangerZoneCard";
import { PaymentMethodCard } from "./components/PaymentMethodCard";
import { PostalConnectionsCard } from "./components/PostalConnectionsCard";
import { ProfileEditCard } from "./components/ProfileEditCard";
import { SecurityCard } from "./components/SecurityCard";
import { SettingsCard } from "./components/SettingsCard";
import { SideNav } from "./components/SideNav";
import { SubscriptionCard } from "./components/SubscriptionCard";
import { PAGE_SECTIONS, type PageSectionsIdType } from "@/constants/profile";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  usePostalConnectionsQuery();
  useMySubscriptionQuery();

  const [activeSection, setActiveSection] =
    useState<PageSectionsIdType>("subscription");

  const activeSectionMeta = PAGE_SECTIONS.find(
    ({ id }) => id === activeSection,
  )!;

  const activeCardBySection: Record<PageSectionsIdType, ReactElement> = {
    subscription: <SubscriptionCard />,
    profile: <ProfileEditCard />,
    settings: <SettingsCard />,
    postal: <PostalConnectionsCard />,
    payment: <PaymentMethodCard />,
    security: <SecurityCard />,
    danger: <DangerZoneCard />,
  };
  const activeCard = activeCardBySection[activeSection];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 py-8 lg:pr-72">
      <div className="min-w-0 flex-1">
        <section
          aria-labelledby={`profile-tab-${activeSection}`}
          className="min-w-0"
        >
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              {t("profile.workspace")}
            </p>
            <h1
              id={`profile-tab-${activeSection}`}
              className="mt-2 text-2xl font-semibold text-neutral-900"
            >
              {t(activeSectionMeta.labelKey)}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {t("profile.workspaceDescription")}
            </p>
          </div>
          {activeCard}
        </section>
      </div>
      <SideNav activeId={activeSection} onSelect={setActiveSection} />
    </div>
  );
}
