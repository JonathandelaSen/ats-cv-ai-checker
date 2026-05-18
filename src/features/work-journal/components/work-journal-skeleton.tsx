import { Skeleton } from "@/components/ui/skeleton";

export function WorkJournalSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="relative pl-10 md:pl-16 pb-16">
          {index < 4 && (
            <div className="absolute left-[11px] md:left-[19px] top-6 bottom-[-1rem] w-px bg-white/[0.08]" />
          )}
          <div className="absolute left-0 md:left-2 top-1.5 h-6 w-6 rounded-full bg-black border-[3px] border-zinc-800 flex items-center justify-center z-10">
            <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
          </div>
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-4/5" />
          <Skeleton className="mt-2 h-5 w-3/5" />
        </div>
      ))}
    </div>
  );
}
