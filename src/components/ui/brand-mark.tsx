import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-primary)]", className)} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="#10241B" />
        <circle cx="32" cy="32" r="20" fill="#FFF8EC" />
        <circle cx="32" cy="32" r="12" fill="#10241B" />
        <path d="M39 39 50 50" stroke="#FFF8EC" strokeWidth="8" strokeLinecap="round" />
        <path d="M39 39 49 49" stroke="#10241B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="48" cy="16" r="6" fill="#20CF63" />
      </svg>
    </span>
  );
}
