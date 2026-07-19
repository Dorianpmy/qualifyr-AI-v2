import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[linear-gradient(145deg,var(--primary-hover),var(--primary-strong))] text-[var(--on-dark)] shadow-[var(--shadow-primary)]", className)} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="size-[1.95rem]" aria-hidden="true">
        <circle cx="31" cy="31" r="18" fill="none" stroke="currentColor" strokeWidth="9" />
        <path d="M41 42 52 53" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
        <circle cx="48" cy="14" r="8" fill="var(--primary)" />
      </svg>
    </span>
  );
}
