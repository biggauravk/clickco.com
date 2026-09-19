import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg bg-foreground/5 px-3.5 text-sm text-foreground placeholder:text-muted-foreground",
        "ring-1 ring-ring/60 outline-none transition-[box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
