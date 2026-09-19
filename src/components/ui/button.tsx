import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-[opacity,transform,background-color,color] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-transparent text-foreground ring-1 ring-ring/70 hover:bg-foreground/5",
        ghost: "bg-transparent text-foreground/80 hover:text-foreground hover:bg-foreground/5",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        sm: "h-10 px-3.5 text-sm rounded-md",
        md: "h-11 px-5 text-sm rounded-lg",
        lg: "h-12 px-6 text-[15px] rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>>(
  ({ className, variant, size, type = "button", ...props }, ref) => <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />,
);
Button.displayName = "Button";
