import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const icons = { info: Info, success: CheckCircle2, danger: AlertCircle };

export function Alert({ title, children, variant = "info", className }: { title: string; children: React.ReactNode; variant?: keyof typeof icons; className?: string }) {
  const Icon = icons[variant];
  return <div role={variant === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-[var(--radius-lg)] border p-4 text-sm", variant === "info" && "border-[var(--primary-border)] bg-[var(--primary-soft)]", variant === "success" && "border-success/20 bg-[var(--success-soft)]", variant === "danger" && "border-danger/20 bg-[var(--danger-soft)]", className)}><Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div><p className="font-bold">{title}</p><div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div></div></div>;
}
