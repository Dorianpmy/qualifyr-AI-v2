"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CircleUserRound,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MailCheck,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { organizationMessages } from "@/features/organizations/messages";
import { OrganizationSwitcher } from "@/features/organizations/components/organization-switcher";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/actions/auth";
import type { OrganizationSummary } from "@/server/organizations/service";

type OrganizationShellProps = {
  children: React.ReactNode;
  organizations: OrganizationSummary[];
  current: OrganizationSummary;
  isPlatformAdmin?: boolean;
};

const navigation = [
  { key: "overview", label: "Vue d’ensemble", icon: LayoutDashboard, suffix: "", exact: true },
  { key: "dossiers", label: "Dossiers", icon: FolderKanban, suffix: "/dossiers", exact: false },
  { key: "services", label: "Services", icon: BriefcaseBusiness, suffix: "/services", exact: false },
  { key: "playbooks", label: "Playbooks", icon: BookOpenCheck, suffix: "/playbooks", exact: false },
  { key: "email", label: "Canal email", icon: MailCheck, suffix: "/canaux/email", exact: false },
  { key: "team", label: "Équipe", icon: Users, suffix: "/membres", exact: false },
] as const;

function Navigation({ slug, pathname, mobile = false }: { slug: string; pathname: string; mobile?: boolean }) {
  return (
    <nav aria-label="Navigation de l’organisation" className="grid gap-1.5">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
        Espace de travail
      </p>
      {navigation.map((item) => {
        const href = `/app/${slug}${item.suffix}`;
        const active = item.exact ? pathname === href : pathname.startsWith(href);
        const Icon = item.icon;
        const link = (
          <Button
            asChild
            liquid={false}
            variant="ghost"
            className={cn(
              "h-11 w-full justify-start gap-3 rounded-[var(--radius-md)] px-3 text-[13px] font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent-hover)] hover:text-[var(--on-dark)]",
              active && "bg-[var(--sidebar-accent)] text-[var(--on-dark)] shadow-[inset_0_0_0_1px_var(--sidebar-border)]",
              mobile && "h-12 text-sm",
            )}
          >
            <Link href={href} aria-current={active ? "page" : undefined}>
              <span className={cn("grid size-7 place-items-center rounded-[var(--radius-xs)]", active && "bg-[var(--primary-soft)] text-[var(--primary-hover)]")}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {item.label}
            </Link>
          </Button>
        );
        return mobile ? <DialogClose key={item.key} asChild>{link}</DialogClose> : <div key={item.key}>{link}</div>;
      })}
      <Button asChild liquid={false} variant="ghost" className="h-11 justify-start gap-3 rounded-[var(--radius-md)] px-3 text-[13px] font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-accent-hover)] hover:text-[var(--on-dark)]">
        <Link href={`/app/${slug}#organisation`}>
          <span className="grid size-7 place-items-center rounded-[var(--radius-xs)]"><Settings2 className="size-4" aria-hidden="true" /></span>
          Paramètres
        </Link>
      </Button>
    </nav>
  );
}

function AccountPanel({ current }: { current: OrganizationSummary }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)]">
          <CircleUserRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--on-dark)]">{current.name}</p>
          <p className="text-[11px] text-[var(--sidebar-muted)]">{organizationMessages.roles[current.role]}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" liquid={false} variant="ghost" size="icon-sm" className="text-[var(--sidebar-muted)] hover:text-[var(--on-dark)]" aria-label="Se déconnecter">
            <LogOut aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function OrganizationShell({ children, organizations, current, isPlatformAdmin = false }: OrganizationShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] overflow-hidden border-r border-[var(--sidebar-border)] bg-sidebar p-4 text-sidebar-foreground shadow-[var(--shadow-sidebar)] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_20%_0%,var(--primary-soft),transparent_58%)]" />
        <Link href={`/app/${current.slug}`} className="focus-ring relative mb-8 flex items-center gap-3 rounded-[var(--radius-sm)] p-1">
          <BrandMark className="size-9" />
          <span>
            <span className="block text-[17px] font-extrabold tracking-[-0.03em]">Qualifyr AI</span>
            <span className="block text-[10px] font-semibold tracking-wide text-[var(--sidebar-muted)]">Qualification opérationnelle</span>
          </span>
        </Link>
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <Navigation slug={current.slug} pathname={pathname} />
        </div>
        <div className="relative grid gap-2.5 border-t border-[var(--sidebar-border)] pt-4">
          {isPlatformAdmin ? <Button asChild liquid={false} variant="glass" className="justify-start text-[var(--on-dark)]"><Link href="/admin"><ShieldCheck aria-hidden="true" />Administration SaaS</Link></Button> : null}
          <Button asChild liquid={false} variant="ghost" className="justify-start text-[var(--sidebar-muted)] hover:text-[var(--on-dark)]">
            <Link href="/app/onboarding"><Plus aria-hidden="true" />Créer une organisation</Link>
          </Button>
          <AccountPanel current={current} />
        </div>
      </aside>

      <div className="min-w-0 bg-background lg:col-start-2">
        <header className="sticky top-0 z-20 h-[var(--header-height)] border-b bg-[var(--header)] px-4 backdrop-blur-[var(--blur-strong)] sm:px-6">
          <div className="mx-auto flex h-full max-w-[var(--content-max)] items-center gap-2.5">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir la navigation"><Menu /></Button>
              </DialogTrigger>
              <DialogContent className="left-0 top-0 h-dvh w-[min(88vw,22rem)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-5 text-sidebar-foreground" style={{ background: "var(--sidebar)" }}>
                <DialogTitle className="flex items-center gap-3"><BrandMark className="size-9" />Qualifyr AI</DialogTitle>
                <DialogDescription className="text-[var(--sidebar-muted)]">Navigation de {current.name}</DialogDescription>
                <div className="mt-8"><Navigation slug={current.slug} pathname={pathname} mobile /></div>
                <div className="absolute inset-x-5 bottom-5"><AccountPanel current={current} /></div>
              </DialogContent>
            </Dialog>
            <div className="min-w-0 flex-1 sm:max-w-72">
              <OrganizationSwitcher organizations={organizations} currentSlug={current.slug} compact />
            </div>
            <ThemeToggle />
          </div>
        </header>
        <div className="animate-enter min-h-[calc(100dvh-var(--header-height))]">{children}</div>
      </div>
    </div>
  );
}
