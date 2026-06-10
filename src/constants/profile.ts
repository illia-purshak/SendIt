export const PAGE_SECTIONS = [
  { id: "profile", labelKey: "layout.profile" },
  { id: "subscription", labelKey: "profile.subscription" },
  { id: "settings", labelKey: "layout.settings" },
  { id: "postal", labelKey: "profile.postalOperators" },
  { id: "payment", labelKey: "profile.paymentMethod" },
  { id: "security", labelKey: "profile.security" },
  { id: "danger", labelKey: "profile.dangerZone" },
] as const;

export type PageSectionsIdType = (typeof PAGE_SECTIONS)[number]["id"];
export type PageSectionsLabelKeyType = (typeof PAGE_SECTIONS)[number]["labelKey"];

export type PageSectionsType = {
  id: PageSectionsIdType;
  labelKey: PageSectionsLabelKeyType;
};
