import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authMessages } from "@/features/auth/messages";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,var(--primary-soft),transparent_34rem)]" />
      <div className="relative w-full max-w-md">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/" className="focus-ring flex items-center gap-3 rounded-[var(--radius-lg)]">
            <BrandMark />
            <span><strong className="block tracking-[-0.025em]">{authMessages.brand.name}</strong><span className="text-xs text-muted-foreground">{authMessages.brand.promise}</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/#forfaits" className="focus-ring rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">Forfaits</Link>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
