import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { FullProfileApiResponse } from "@/api/auth";
import { ProfileRouteContext } from "./profile-route-context";

export function ProfileRouteProvider({
  value,
  children,
}: {
  value: UseQueryResult<FullProfileApiResponse>;
  children: ReactNode;
}) {
  return (
    <ProfileRouteContext.Provider value={value}>
      {children}
    </ProfileRouteContext.Provider>
  );
}
