import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none", {
  variants: {
    variant: {
      neutral: "border-border bg-muted text-muted-foreground",
      success: "border-primary/20 bg-[var(--success-soft)] text-[var(--success)]",
      warning: "border-warning/20 bg-[var(--warning-soft)] text-[var(--warning)]",
      danger: "border-danger/20 bg-[var(--danger-soft)] text-destructive",
    },
  },
  defaultVariants: { variant: "neutral" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
