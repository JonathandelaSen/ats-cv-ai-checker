import { cn } from "@/lib/utils";
import type React from "react";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-white/[0.08]", className)}
      {...props}
    />
  );
}

export { Skeleton };
