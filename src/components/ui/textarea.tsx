import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-lg bg-foreground/5 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground",
        "ring-1 ring-ring/60 outline-none transition-[box-shadow] duration-150",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
