import { Skeleton } from "@/components/ui/skeleton";

export function CVAnalysesListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex w-full items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <div className="mt-2 flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-7 w-10 shrink-0 rounded-lg" />
          <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
