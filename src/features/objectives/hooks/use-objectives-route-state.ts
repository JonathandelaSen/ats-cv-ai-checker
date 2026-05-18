"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const basePath = "/objectives";
export type ObjectivesFilter = "open" | "closed" | "all";

function normalizeStatus(value: string | null): ObjectivesFilter {
  return value === "closed" || value === "all" ? value : "open";
}

export function useObjectivesRouteState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const status = normalizeStatus(searchParams.get("status"));
  const objectiveId = pathname.startsWith(`${basePath}/`)
    ? decodeURIComponent(pathname.slice(`${basePath}/`.length).split("/")[0] ?? "") ||
      null
    : null;

  const hrefFor = useCallback(
    (nextObjectiveId: string | null, nextStatus = status) => {
      const query = new URLSearchParams({ status: nextStatus });
      return nextObjectiveId
        ? `${basePath}/${encodeURIComponent(nextObjectiveId)}?${query.toString()}`
        : `${basePath}?${query.toString()}`;
    },
    [status]
  );

  const setStatus = useCallback(
    (nextStatus: ObjectivesFilter) => {
      window.history.pushState(null, "", hrefFor(objectiveId, nextStatus));
    },
    [hrefFor, objectiveId]
  );

  const selectObjective = useCallback(
    (nextObjectiveId: string) => {
      window.history.pushState(null, "", hrefFor(nextObjectiveId));
    },
    [hrefFor]
  );

  const replaceObjective = useCallback(
    (nextObjectiveId: string) => {
      window.history.replaceState(null, "", hrefFor(nextObjectiveId));
    },
    [hrefFor]
  );

  const clearObjective = useCallback(() => {
    window.history.replaceState(null, "", hrefFor(null));
  }, [hrefFor]);

  return {
    objectiveId,
    pathname,
    status,
    hrefFor,
    setStatus,
    selectObjective,
    replaceObjective,
    clearObjective,
  };
}
