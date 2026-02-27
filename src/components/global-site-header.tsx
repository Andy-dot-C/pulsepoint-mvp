"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FeedFilterKey } from "@/lib/types";

type GlobalSiteHeaderProps = {
  signedIn: boolean;
  username: string | null;
  role: "user" | "admin" | null;
};

function resolveFilter(value: string | null): FeedFilterKey {
  if (
    value === "trending" ||
    value === "new" ||
    value === "most-voted" ||
    value === "saved" ||
    value === "politics" ||
    value === "sport" ||
    value === "entertainment" ||
    value === "culture" ||
    value === "hot-takes"
  ) {
    return value;
  }
  return "trending";
}

export function GlobalSiteHeader({ signedIn, username, role }: GlobalSiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFilter = pathname === "/" ? resolveFilter(searchParams.get("filter")) : "trending";
  const searchQuery = pathname === "/" ? (searchParams.get("q") ?? "").trim() : "";

  return (
    <SiteHeader
      activeFilter={activeFilter}
      searchQuery={searchQuery}
      signedIn={signedIn}
      username={username}
      role={role}
    />
  );
}
