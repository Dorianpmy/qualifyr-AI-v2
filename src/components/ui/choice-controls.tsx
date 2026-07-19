import { cn } from "@/lib/utils";

export function Checkbox({ label, className, ...props }: Omit<React.ComponentProps<"input">, "type"> & { label: string }) {
  return <label className={cn("flex min-h-11 items-center gap-3 text-sm font-medium", className)}><input type="checkbox" className="size-4 accent-primary" {...props} /><span>{label}</span></label>;
}
export function Radio({ label, className, ...props }: Omit<React.ComponentProps<"input">, "type"> & { label: string }) {
  return <label className={cn("flex min-h-11 items-center gap-3 text-sm font-medium", className)}><input type="radio" className="size-4 accent-primary" {...props} /><span>{label}</span></label>;
}
export function Switch({ label, className, ...props }: Omit<React.ComponentProps<"input">, "type"> & { label: string }) {
  return <label className={cn("flex min-h-11 items-center gap-3 text-sm font-medium", className)}><input type="checkbox" role="switch" className="peer sr-only" {...props} /><span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-surface after:shadow-[var(--shadow-xs)] after:transition-transform peer-checked:after:translate-x-5" /><span>{label}</span></label>;
}
