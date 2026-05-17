import { Skeleton } from "@/components/ui/skeleton";

export function ObjectivesSidebarSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <section key={groupIndex}>
          <div className="mb-2 flex items-center justify-between px-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-4" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: groupIndex === 0 ? 3 : 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/8 bg-white/[0.025] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-sm" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ObjectivesDetailSkeleton() {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-xl border border-emerald-200/10 bg-white/[0.035] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full bg-emerald-300/10" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="mt-4 h-8 w-3/5" />
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-10 rounded-md" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-4 h-20 w-full rounded-lg bg-emerald-300/[0.04]" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mb-4 h-1.5 w-full rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
