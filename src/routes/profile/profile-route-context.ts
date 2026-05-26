import { createContext } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { FullProfileApiResponse } from "@/api/auth";

export const ProfileRouteContext =
  createContext<UseQueryResult<FullProfileApiResponse> | null>(null);
