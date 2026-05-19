import { Suspense } from "react";
import { ActivityContextView } from "@/features/activity-context";

export default function ActivityContextsPage() {
  return (
    <Suspense>
      <ActivityContextView />
    </Suspense>
  );
}
