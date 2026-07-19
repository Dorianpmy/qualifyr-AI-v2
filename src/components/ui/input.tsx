import * as React from "react";

import { cn } from "@/lib/utils";

const controlClass = "focus-ring w-full rounded-[var(--radius-lg)] border border-input bg-surface px-4 text-sm text-foreground shadow-[var(--shadow-xs)] transition-[border-color,background-color,box-shadow] duration-[var(--duration-base)] placeholder:text-muted-foreground hover:border-primary/35 focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" type={type} className={cn(controlClass, "h-12", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(controlClass, "min-h-28 resize-y py-3", className)} {...props} />;
}

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn(controlClass, "h-12 appearance-none", className)} {...props}>{children}</select>;
}

function Field({ className, label, hint, error, children, ...props }: React.ComponentProps<"div"> & { label: string; hint?: string | undefined; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {children}
      </label>
      {error ? <span role="alert" className="text-xs font-medium text-destructive">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export { Field, Input, Select, Textarea };
