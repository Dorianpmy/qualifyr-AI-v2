"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, BriefcaseBusiness, FolderKanban, Home, LogOut, Menu, Plus, Users } from "lucide-react";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { dashboardMessages as messages } from "@/features/dashboard/messages";
import { OrganizationSwitcher } from "@/features/organizations/components/organization-switcher";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";
import type { OrganizationSummary } from "@/server/organizations/service";

type OrganizationShellProps = {
  children: React.ReactNode;
  organizations: OrganizationSummary[];
  current: OrganizationSummary;
};

function Navigation({ slug, pathname, mobile = false }: { slug: string; pathname: string; mobile?: boolean }) {
  const items = [
    { href: `/app/${slug}`, label: messages.navigation.home, icon: Home, exact: true },
    { href: `/app/${slug}/dossiers`, label: messages.navigation.dossiers, icon: FolderKanban, exact: false },
    { href: `/app/${slug}/services`, label: messages.navigation.services, icon: BriefcaseBusiness, exact: false },
    { href: `/app/${slug}/playbooks`, label: messages.navigation.playbooks, icon: BookOpenCheck, exact: false },
    { href: `/app/${slug}/membres`, label: messages.navigation.members, icon: Users, exact: false },
  ];
  return <nav aria-label="Navigation de l’organisation" className="grid gap-2">{items.map((item) => {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const Icon = item.icon;
    return <Button key={item.href} asChild variant={active ? "glass" : "ghost"} className={cn("w-full justify-start", mobile && "min-h-12 text-base")}><Link href={item.href} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" />{item.label}</Link></Button>;
  })}</nav>;
}

export function OrganizationShell({ children, organizations, current }: OrganizationShellProps) {
  const pathname = usePathname();
  return <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-width)_1fr]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-[var(--shadow-sidebar)] lg:flex lg:flex-col">
      <Link href={`/app/${current.slug}`} className="focus-ring mb-8 flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-1"><BrandMark /><span className="font-extrabold tracking-[-0.025em]">Qualifyr AI</span></Link>
      <Navigation slug={current.slug} pathname={pathname} />
      <div className="mt-auto grid gap-3 border-t border-sidebar-border pt-4"><p className="px-2 text-xs font-semibold text-[var(--sidebar-muted)]">{current.name}</p><Button asChild variant="ghost" className="justify-start"><Link href="/app/onboarding"><Plus />Créer une organisation</Link></Button></div>
    </aside>
    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 border-b bg-[var(--header)] px-4 py-3 backdrop-blur-[var(--blur-soft)] sm:px-6">
        <div className="mx-auto flex max-w-[var(--content-max)] items-center gap-2">
          <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir la navigation"><Menu /></Button></DialogTrigger><DialogContent className="inset-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none bg-sidebar text-sidebar-foreground"><DialogTitle className="flex items-center gap-3"><BrandMark />Qualifyr AI</DialogTitle><DialogDescription className="text-[var(--sidebar-muted)]">Navigation de {current.name}</DialogDescription><div className="mt-8"><Navigation slug={current.slug} pathname={pathname} mobile /></div></DialogContent></Dialog>
          <div className="min-w-0 flex-1 sm:max-w-xs"><OrganizationSwitcher organizations={organizations} currentSlug={current.slug} /></div>
          <ThemeToggle />
          <form action={signOutAction}><Button type="submit" variant="ghost" size="icon" aria-label="Se déconnecter"><LogOut /></Button></form>
        </div>
      </header>
      {children}
    </div>
  </div>;
}
