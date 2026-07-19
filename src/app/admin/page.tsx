import { Building2, FileStack, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformOverview } from "@/server/platform-admin/service";

export default async function PlatformAdminPage() {
  const overview = await getPlatformOverview();
  const metrics = [
    { label: "Organisations", value: overview.organizations_count, icon: Building2 },
    { label: "Utilisateurs", value: overview.users_count, icon: Users },
    { label: "Dossiers", value: overview.dossiers_count, icon: FileStack },
  ];

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-[var(--content-max)] space-y-6">
        <header className="qualifyr-glass flex items-center gap-3 rounded-[var(--radius-2xl)] p-4 sm:p-5">
          <BrandMark />
          <div>
            <p className="font-extrabold">Qualifyr AI</p>
            <p className="text-xs text-muted-foreground">Administration de la plateforme</p>
          </div>
          <Badge className="ml-auto gap-1.5" variant="success"><ShieldCheck className="size-3.5" />Platform admin</Badge>
          <Button asChild variant="glass"><Link href="/app">Retour à l’espace</Link></Button>
        </header>

        <section>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Contrôle SaaS</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">Vue globale de Qualifyr AI</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Un espace interne séparé des organisations clientes et protégé côté serveur.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="qualifyr-glass">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-11 place-items-center rounded-full bg-[var(--primary-soft)] text-primary"><Icon /></span>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-black">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="qualifyr-glass">
          <CardHeader><CardTitle>Organisations clientes</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {overview.organizations.length === 0 ? <p className="text-sm text-muted-foreground">Aucune organisation.</p> : overview.organizations.map((organization) => (
              <div key={organization.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--glass)] p-4">
                <div className="min-w-0 flex-1"><p className="font-bold">{organization.name}</p><p className="text-xs text-muted-foreground">/{organization.slug}</p></div>
                <Badge variant="neutral">{organization.members_count} membre(s)</Badge>
                <Badge variant="neutral">{organization.dossiers_count} dossier(s)</Badge>
                <Button asChild size="sm" variant="glass"><Link href={`/app/${organization.slug}`}>Ouvrir</Link></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
