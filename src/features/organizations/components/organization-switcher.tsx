"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/input";
import type { OrganizationSummary } from "@/server/organizations/service";

export function OrganizationSwitcher({ organizations, currentSlug }: { organizations: OrganizationSummary[]; currentSlug?: string }) {
  const router = useRouter();
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
      Organisation active
      <Select aria-label="Organisation active" value={currentSlug ?? ""} onChange={(event) => {
        const slug = event.target.value;
        if (slug === "__new__") router.push("/app/onboarding");
        else if (slug) router.push(`/app/${slug}`);
      }}>
        {!currentSlug ? <option value="">Choisir une organisation</option> : null}
        {organizations.map((organization) => <option key={organization.id} value={organization.slug}>{organization.name}</option>)}
        <option value="__new__">Créer une organisation…</option>
      </Select>
    </label>
  );
}
