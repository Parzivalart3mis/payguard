import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "select-none-ui inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        secondary:
          "border border-border bg-surface text-text hover:bg-background",
        outline: "border border-border text-text hover:bg-surface",
        ghost: "text-text hover:bg-surface",
        destructive: "bg-error text-white hover:bg-error/90",
      },
      size: {
        sm: "min-h-[40px] px-3 text-base",
        md: "min-h-[44px] px-4 text-base",
        lg: "min-h-[48px] px-5 text-lg",
        icon: "min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
