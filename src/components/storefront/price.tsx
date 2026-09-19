import { formatInr } from "@/lib/store/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  selling,
  discount,
  className,
}: {
  price: number;
  selling: number;
  discount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2 tabular-nums", className)}>
      <span className="text-foreground">{formatInr(selling)}</span>
      {discount > 0 ? (
        <>
          <span className="text-sm text-muted-foreground line-through">{formatInr(price)}</span>
          <span className="text-xs tracking-wide text-muted-foreground">{discount}% off</span>
        </>
      ) : null}
    </div>
  );
}
