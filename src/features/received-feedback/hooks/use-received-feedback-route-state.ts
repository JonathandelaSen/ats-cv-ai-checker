"use client";

import { usePathname } from "next/navigation";

export function useReceivedFeedbackRouteState() {
  const pathname = usePathname();

  return {
    pathname,
  };
}
