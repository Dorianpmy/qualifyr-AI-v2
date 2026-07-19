import Link from "next/link";
import { LogOut, Users } from "lucide-react";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOutAction } from "@/server/actions/auth";
import type { OrganizationSummary } from "@/server/organizations/service";
import { OrganizationSwitcher } from "./organization-switcher";

export function OrganizationHeader({ organizations, current }: { organizations: OrganizationSummary[]; current?: OrganizationSummary }) {
  return <header className="sticky top-0 z-20 border-b bg-[var(--header)] px-4 py-3 backdrop-blur-[var(--blur-soft)] sm:px-6"><div className="mx-auto flex max-w-[var(--content-max)] flex-wrap items-center gap-3"><Link href="/app" className="focus-ring flex items-center gap-3 rounded"><BrandMark /><span className="font-extrabold tracking-[-0.025em]">Qualifyr AI</span></Link><div className="ml-auto flex items-center gap-2">{current ? <Button asChild variant="ghost" size="sm"><Link href={`/app/${current.slug}/membres`}><Users />Membres</Link></Button> : null}<ThemeToggle /><form action={signOutAction}><Button type="submit" variant="ghost" size="icon" aria-label="Se déconnecter"><LogOut /></Button></form></div><div className="w-full sm:ml-auto sm:w-72"><OrganizationSwitcher organizations={organizations} {...(current ? { currentSlug: current.slug } : {})} /></div></div></header>;
}
