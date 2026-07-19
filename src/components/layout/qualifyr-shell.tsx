"use client";

import { Bell, ChevronLeft, Component, LayoutGrid, Menu, Palette, Search, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Vue d’ensemble", icon: LayoutGrid, active: true },
  { label: "Identité visuelle", icon: Palette },
  { label: "Composants", icon: Component },
];

export function QualifyrShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav aria-label="Navigation principale" className="mt-6 space-y-1.5">
      <p className={cn("mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]", collapsed && "sr-only")}>Fondations</p>
      {navigation.map(({ label, icon: Icon, active }) => (
        <button key={label} type="button" className={cn("focus-ring group flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 text-left text-[13px] font-semibold text-[var(--sidebar-muted)] transition duration-[var(--duration-base)] hover:bg-[var(--sidebar-accent-hover)] hover:text-[var(--on-dark)]", active && "bg-[var(--sidebar-accent)] text-[var(--on-dark)] ring-1 ring-[var(--sidebar-border)]")} aria-current={active ? "page" : undefined}>
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-[var(--radius-xs)] bg-[var(--sidebar-accent)]", active && "bg-[var(--primary-soft)] text-[var(--sidebar-primary-foreground)]")}><Icon className="size-4" aria-hidden="true" /></span>
          <span className={cn("truncate transition-opacity", collapsed && "lg:hidden")}>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-[var(--sidebar-border)] bg-sidebar px-4 py-4 text-sidebar-foreground shadow-[var(--shadow-sidebar)] transition-[width] duration-[var(--duration-base)] lg:flex lg:flex-col", collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_18%_0%,var(--primary-soft),transparent_52%)]" />
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="focus-ring absolute right-3 top-5 z-10 grid size-8 place-items-center rounded-full border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-accent-hover)] hover:text-[var(--on-dark)]" aria-label={collapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}><ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} /></button>
        <div className="relative flex items-center gap-3 pr-8">
          <BrandMark />
          <div className={cn("min-w-0 transition-opacity", collapsed && "lg:hidden")}><p className="truncate text-[18px] font-extrabold tracking-[-0.03em]">Qualifyr AI</p><p className="truncate text-[11px] font-semibold text-[var(--sidebar-muted)]">Intelligence opérationnelle</p></div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto">{nav}</div>
        <div className={cn("relative rounded-[var(--radius-xl)] border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] p-3", collapsed && "hidden")}><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">Design system</p><p className="mt-1.5 text-[13px] font-semibold">Identité V1 synchronisée</p><p className="mt-1 text-[11px] leading-relaxed text-[var(--sidebar-muted)]">Tokens, composants et mouvements centralisés.</p></div>
      </aside>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[var(--blur-soft)] lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-0 z-50 bg-sidebar p-5 text-sidebar-foreground outline-none lg:hidden" aria-describedby={undefined}>
            <div className="flex items-center gap-3"><BrandMark /><div><DialogPrimitive.Title className="font-extrabold">Qualifyr AI</DialogPrimitive.Title><p className="text-xs text-[var(--sidebar-muted)]">Intelligence opérationnelle</p></div><DialogPrimitive.Close asChild><Button className="ml-auto text-[var(--on-dark)]" variant="ghost" size="icon" aria-label="Fermer le menu"><X /></Button></DialogPrimitive.Close></div>
            {nav}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className={cn("transition-[padding] duration-[var(--duration-base)]", collapsed ? "lg:pl-[var(--sidebar-width-collapsed)]" : "lg:pl-[var(--sidebar-width)]")}>
        <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center border-b bg-[var(--header)] px-4 backdrop-blur-[var(--blur-strong)] sm:px-6">
          <div className="mx-auto flex w-full max-w-[var(--content-max)] items-center gap-2.5">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu /></Button>
            <div className="hidden h-9 min-w-52 items-center gap-2 rounded-full border bg-surface px-3 text-sm text-muted-foreground shadow-[var(--shadow-xs)] sm:flex"><Search className="size-4" /><span>Rechercher</span><kbd className="ml-auto text-[10px]">⌘ K</kbd></div>
            <span className="ml-auto hidden items-center gap-2 rounded-full border border-primary/20 bg-[var(--success-soft)] px-3 py-1.5 text-[11px] font-semibold text-[var(--success)] sm:inline-flex"><span className="size-1.5 rounded-full bg-primary" />Design prêt</span>
            <Button variant="secondary" size="icon-sm" aria-label="Notifications"><Bell /></Button>
            <ThemeToggle />
            <span className="grid size-8 place-items-center rounded-full bg-sidebar text-[11px] font-bold text-[var(--on-dark)] shadow-[var(--shadow-primary)]">QA</span>
          </div>
        </header>
        <main className="animate-enter mx-auto w-full max-w-[var(--content-max)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
