import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-foreground/12",
        className,
      )}
      {...props}
    />
  );
}
