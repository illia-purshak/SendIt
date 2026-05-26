import { useContext } from "react";
import { ProfileRouteContext } from "./profile-route-context";

export function useProfileRouteData() {
  const context = useContext(ProfileRouteContext);

  if (!context) {
    throw new Error("useProfileRouteData must be used within ProfileRoute");
  }

  return context;
}
