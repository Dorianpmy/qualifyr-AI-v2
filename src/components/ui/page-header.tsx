import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, titleId, description, actions, className }: { eyebrow?: React.ReactNode; title: string; titleId?: string; description?: string; actions?: React.ReactNode; className?: string }) {
  return <header className={cn("flex flex-col justify-between gap-5 md:flex-row md:items-end", className)}><div className="max-w-2xl">{eyebrow}<h1 id={titleId} className="mt-4 text-balance text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl lg:text-5xl">{title}</h1>{description ? <p className="mt-4 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>;
}
export function SectionHeader({ title, description, className }: { title: string; description?: string; className?: string }) { return <div className={cn("mb-4", className)}><h2 className="text-lg font-bold tracking-[-0.025em]">{title}</h2>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>; }
