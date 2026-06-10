import { t } from "@/i18n/utils";

export function getRoleLabel(role: string) {
  switch (role) {
    case "CLIENT":
      return t("common.client");
    case "ADMIN":
      return t("common.admin");
    case "SUPER_ADMIN":
      return t("common.superAdmin");
    default:
      return role;
  }
}
