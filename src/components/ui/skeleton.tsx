import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("relative overflow-hidden rounded-[var(--radius-sm)] bg-muted before:absolute before:inset-0 before:-translate-x-[130%] before:animate-[qualifyr-shimmer_1.5s_var(--ease-standard)_infinite] before:bg-[linear-gradient(90deg,transparent,var(--glass-highlight),transparent)]", className)} {...props} />;
}
