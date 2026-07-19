import { ArrowRight, Check, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const foundations = [
  { icon: Layers3, label: "Architecture modulaire" },
  { icon: ShieldCheck, label: "Multi-tenant par défaut" },
  { icon: Sparkles, label: "Couche IA centralisée" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="qualifyr-orb qualifyr-orb-primary" />
      <div className="qualifyr-orb qualifyr-orb-secondary" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              Q
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Qualifyr AI</p>
              <p className="text-xs text-muted-foreground">Version 2 · Fondations</p>
            </div>
          </div>
          <span className="status-pill">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
            Socle prêt
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="eyebrow mb-6">
              <Sparkles className="size-3.5" />
              AI-first, humainement validé
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Une base propre pour le nouveau cœur de Qualifyr.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Le produit sera construit autour du Dossier. Cette première étape
              installe uniquement les frontières techniques, la sécurité et le
              design system nécessaires pour avancer sans dette prématurée.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" className="glass-button h-11 px-5">
                Fondations installées
                <Check data-icon="inline-end" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-5">
                Lire l’architecture
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>

          <aside className="glass-card rounded-3xl p-3">
            <div className="rounded-[calc(var(--radius)*1.8)] border border-white/6 bg-black/15 p-6 sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Qualifyr AI V2
              </p>
              <h2 className="mt-3 text-xl font-medium tracking-tight">
                Prêt pour la suite, sans métier anticipé.
              </h2>
              <div className="mt-7 space-y-3">
                {foundations.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="glass-hover flex items-center gap-3 rounded-xl border border-white/6 px-4 py-3 text-sm text-foreground/90"
                  >
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="size-4" />
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 py-5 text-xs text-muted-foreground">
          <span>L’IA comprend · Le moteur qualifie · L’humain valide</span>
          <span className="font-mono">FOUNDATION / 01</span>
        </footer>
      </section>
    </main>
  );
}
