import { Skeleton } from "@/components/ui/skeleton";

export function FeedbackNotesListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="rounded-lg px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function FeedbackNotesDetailSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <section className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-8 w-1/2" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mb-4 h-28 w-full rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </section>
    </div>
  );
}
