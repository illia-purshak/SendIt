export const PAGE_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "subscription", label: "Subscription" },
  { id: "settings", label: "Settings" },
  { id: "postal", label: "Postal operators" },
  { id: "payment", label: "Payment method" },
  { id: "security", label: "Security" },
  { id: "danger", label: "Danger zone" },
] as const;

export type PageSectionsIdType = (typeof PAGE_SECTIONS)[number]["id"];
export type PageSectionsLabelType = (typeof PAGE_SECTIONS)[number]["label"];

export type PageSectionsType = {
  id: PageSectionsIdType;
  label: PageSectionsLabelType;
};
