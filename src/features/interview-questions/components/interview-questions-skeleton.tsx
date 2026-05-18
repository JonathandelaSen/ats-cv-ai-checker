"use client";

export function InterviewQuestionsSkeleton() {
  return (
    <div className="flex h-full min-h-0 gap-6 p-6 md:p-8">
      <div className="hidden w-[380px] animate-pulse rounded-xl bg-white/[0.03] xl:block" />
      <div className="min-w-0 flex-1 animate-pulse rounded-xl bg-white/[0.03]" />
    </div>
  );
}
