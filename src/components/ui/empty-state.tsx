import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode; className?: string }) {
  return <div className={cn("grid place-items-center rounded-[var(--radius-xl)] border border-dashed p-8 text-center", className)}><span className="grid size-12 place-items-center rounded-[var(--radius-lg)] bg-[var(--primary-soft)] text-primary"><Icon className="size-5" /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}
