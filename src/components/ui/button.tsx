import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring group relative isolate inline-flex shrink-0 select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-[var(--radius-md)] border text-sm font-semibold transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-[var(--duration-slow)] ease-[var(--ease-standard)] before:pointer-events-none before:absolute before:-inset-x-6 before:-inset-y-4 before:translate-x-[-45%] before:scale-75 before:rounded-full before:bg-[radial-gradient(circle,var(--liquid-green-strong)_0%,var(--liquid-green)_42%,transparent_72%)] before:opacity-0 before:blur-md before:transition-[transform,opacity] before:duration-[var(--duration-liquid)] before:ease-[var(--ease-out)] after:pointer-events-none after:absolute after:inset-0 after:translate-x-[-140%] after:bg-[linear-gradient(110deg,transparent_18%,var(--glass-highlight)_42%,var(--liquid-green)_52%,transparent_72%)] after:transition-transform after:duration-[var(--duration-liquid)] after:ease-[var(--ease-out)] hover:-translate-y-0.5 hover:before:translate-x-[38%] hover:before:scale-125 hover:before:opacity-100 hover:after:translate-x-[140%] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 disabled:saturate-50 data-[liquid=false]:before:hidden data-[liquid=false]:after:hidden data-[liquid=false]:transition-[background-color,border-color,color,opacity] data-[liquid=false]:duration-[var(--duration-base)] data-[liquid=false]:hover:translate-y-0 [&_svg]:relative [&_svg]:z-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-[var(--on-dark)] shadow-[var(--shadow-primary)] hover:border-[var(--primary-hover)] hover:bg-[var(--primary-hover)] hover:text-[var(--on-dark)] hover:backdrop-blur-[var(--blur-soft)]",
        glass: "border-[var(--glass-border)] bg-[var(--glass)] text-foreground shadow-[var(--shadow-soft)] backdrop-blur-[var(--blur-soft)] hover:border-[var(--primary-border)] hover:bg-[var(--glass-strong)] hover:shadow-[var(--shadow-hover)]",
        secondary: "border-border bg-surface text-foreground shadow-[var(--shadow-xs)] hover:border-primary/35 hover:bg-[var(--primary-soft)]",
        outline: "border-border-strong bg-transparent text-foreground hover:border-primary/45 hover:bg-[var(--glass)] hover:shadow-[var(--shadow-soft)] hover:backdrop-blur-[var(--blur-soft)]",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-[var(--surface-hover)] hover:text-foreground",
        destructive: "border-danger/20 bg-[var(--danger-soft)] text-destructive before:hidden after:hidden hover:border-danger/35 hover:bg-destructive hover:text-[var(--on-dark)]",
        link: "h-auto border-transparent bg-transparent p-0 text-primary-strong shadow-none after:hidden hover:translate-y-0 hover:underline",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-xs",
        default: "h-10 gap-2 px-4",
        lg: "h-12 gap-2 px-5",
        icon: "size-10",
        "icon-sm": "size-8 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant, size, asChild = false, loading = false, liquid = true, disabled, children, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean; liquid?: boolean }) {
  const classes = cn(buttonVariants({ variant, size, className }));
  if (asChild) return <Slot.Root data-slot="button" data-liquid={liquid} className={classes}>{children}</Slot.Root>;
  return <button data-slot="button" data-liquid={liquid} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}{children}</button>;
}

export { Button, buttonVariants };
