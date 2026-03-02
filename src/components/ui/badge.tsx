import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-border text-ink-secondary",
        accent: "bg-accent-light text-accent",
        success: "bg-success-light text-success",
        warning: "bg-warning-light text-warning",
        danger: "bg-danger-light text-danger",
        outline: "border border-border text-ink-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
