import { Skeleton } from "@/components/ui/skeleton";

export function ObservabilityListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-white/[0.06] bg-[#101018] p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-1 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ObservabilityDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-white/[0.06] p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/[0.06] bg-[#101018] p-3"
            >
              <Skeleton className="mb-1 h-3 w-12" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-3 border-l border-white/[0.08] pl-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/[0.06] bg-[#101018] p-3"
            >
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-1 h-3 w-1/3" />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
