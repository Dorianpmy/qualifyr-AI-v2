import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { billingMessages } from "@/features/billing/messages";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { getAuthContext } from "@/server/auth/get-auth-context";

export default async function HomePage() {
  const auth = await getAuthContext();

  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <header className="sticky top-0 z-30 border-b bg-[var(--header)] px-4 backdrop-blur-[var(--blur-strong)] sm:px-6">
        <div className="mx-auto flex h-[var(--header-height)] max-w-[var(--content-max)] items-center gap-3">
          <Link href="/" className="focus-ring flex items-center gap-3 rounded-[var(--radius-md)]">
            <BrandMark className="size-9" />
            <span className="font-extrabold tracking-[-0.03em]">Qualifyr AI</span>
          </Link>
          <nav aria-label="Navigation publique" className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="#forfaits">{billingMessages.navigation.pricing}</Link></Button>
            <ThemeToggle />
            <Button asChild size="sm" variant="glass">
              <Link href={auth ? "/app" : "/connexion"}>{auth ? billingMessages.navigation.openApp : billingMessages.navigation.signIn}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="relative px-4 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_70%_8%,var(--primary-soft),transparent_38rem)]" />
        <section className="relative mx-auto grid min-h-[38rem] max-w-[var(--content-max)] items-center gap-10 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary-strong)]"><Sparkles className="size-3.5" aria-hidden="true" />{billingMessages.hero.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">{billingMessages.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{billingMessages.hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="#forfaits">Voir les forfaits<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="glass"><Link href="/connexion">Se connecter</Link></Button>
            </div>
          </div>
          <div className="qualifyr-glass rounded-[var(--radius-3xl)] p-6 sm:p-8">
            <BrandMark className="size-14" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-primary">Le Dossier au centre</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">L’IA comprend. Le moteur qualifie. L’humain valide.</h2>
            <div className="mt-8 grid gap-3 text-sm">
              {["Accès sécurisé avant toute donnée privée", "Règles explicables et configurables", "Validation humaine toujours prioritaire"].map((item) => <p key={item} className="flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--glass)] p-3"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />{item}</p>)}
            </div>
          </div>
        </section>

        <div className="relative mx-auto max-w-[var(--content-max)]"><PricingSection /></div>
      </div>
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">{billingMessages.footer}</footer>
    </main>
  );
}
