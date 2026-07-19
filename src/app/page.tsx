import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileQuestion,
  LockKeyhole,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { marketingMessages as messages } from "@/features/marketing/messages";
import { getAuthContext } from "@/server/auth/get-auth-context";

const outcomeIcons = [SearchCheck, ClipboardCheck, FileQuestion, FileCheck2] as const;
const audienceIcons = [Wrench, BriefcaseBusiness, ClipboardCheck, Bot, FileCheck2, MessageSquareText] as const;

function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description?: string; centered?: boolean }) {
  return <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">{title}</h2>{description ? <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p> : null}</div>;
}

function ProductDemo() {
  return (
    <div className="qualifyr-glass grid gap-4 rounded-[var(--radius-3xl)] p-4 sm:p-6 lg:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-[var(--radius-2xl)] border bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-label={messages.demo.incomingLabel}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground"><MessageSquareText className="size-4 text-primary" aria-hidden="true" />{messages.demo.incomingLabel}</p>
        <blockquote className="mt-6 text-lg font-semibold leading-8">« {messages.demo.incomingText} »</blockquote>
        <p className="mt-8 text-xs text-muted-foreground">Message libre · aucun formulaire imposé</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[var(--radius-2xl)] border bg-[var(--glass)] p-5" aria-label={messages.demo.extractedLabel}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"><Sparkles className="size-4" aria-hidden="true" />{messages.demo.extractedLabel}</p>
          <ul className="mt-4 grid gap-2.5 text-sm">{messages.demo.extracted.map((item) => <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul>
        </section>
        <section className="rounded-[var(--radius-2xl)] border bg-[var(--glass)] p-5" aria-label={messages.demo.missingLabel}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--warning)]"><FileQuestion className="size-4" aria-hidden="true" />{messages.demo.missingLabel}</p>
          <ul className="mt-4 grid gap-2.5 text-sm">{messages.demo.missing.map((item) => <li key={item} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--warning)]" />{item}</li>)}</ul>
        </section>
        <section className="rounded-[var(--radius-2xl)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 sm:col-span-2" aria-label={messages.demo.readyLabel}>
          <div className="flex flex-wrap items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-primary text-[var(--on-dark)] shadow-[var(--shadow-primary)]"><FileCheck2 aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--primary-strong)]">{messages.demo.readyLabel}</p><p className="mt-1 font-bold">Climatisation · intervention à Lyon</p></div><span className="rounded-full border border-[var(--primary-border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--primary-strong)]">Validation humaine requise</span></div>
        </section>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const auth = await getAuthContext();

  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <header className="sticky top-0 z-30 border-b bg-[var(--header)] px-4 backdrop-blur-[var(--blur-strong)] sm:px-6">
        <div className="mx-auto flex h-[var(--header-height)] max-w-[var(--content-max)] items-center gap-3">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5 rounded-[var(--radius-md)]"><BrandMark className="size-9" /><span className="whitespace-nowrap font-extrabold tracking-[-.03em]">Qualifyr AI</span></Link>
          <nav aria-label="Navigation publique" className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1 lg:flex">
              <Button asChild liquid={false} variant="ghost" size="sm"><Link href="#produit">{messages.navigation.product}</Link></Button>
              <Button asChild liquid={false} variant="ghost" size="sm"><Link href="#metiers">{messages.navigation.useCases}</Link></Button>
              <Button asChild liquid={false} variant="ghost" size="sm"><Link href="#securite">{messages.navigation.security}</Link></Button>
              <Button asChild liquid={false} variant="ghost" size="sm"><Link href="#forfaits">{messages.navigation.pricing}</Link></Button>
            </div>
            <ThemeToggle />
            <Button asChild size="sm" variant="glass"><Link href={auth ? "/app" : "/connexion"}>{auth ? "Ouvrir mon espace" : "Se connecter"}</Link></Button>
          </nav>
        </div>
      </header>

      <div className="relative px-4 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_72%_8%,var(--primary-soft),transparent_40rem)]" />
        <section className="relative mx-auto grid min-h-[42rem] max-w-[var(--content-max)] items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary-strong)]"><Sparkles className="size-3.5" aria-hidden="true" />{messages.hero.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">{messages.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{messages.hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/inscription?plan=professional">{messages.hero.primaryAction}<ArrowRight aria-hidden="true" /></Link></Button><Button asChild size="lg" variant="glass"><Link href="#produit">{messages.hero.secondaryAction}</Link></Button></div>
            <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />{messages.hero.reassurance}</p>
          </div>
          <div className="qualifyr-glass rounded-[var(--radius-3xl)] p-6 sm:p-8"><BrandMark className="size-14" /><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-primary">Le Dossier au centre</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">L’IA comprend. Le moteur qualifie. L’humain valide.</h2><div className="mt-8 grid gap-3 text-sm">{["Demande libre comprise sans formulaire rigide", "Informations manquantes rendues visibles", "Décision finale conservée par votre équipe"].map((item) => <p key={item} className="flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[var(--glass)] p-3"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />{item}</p>)}</div></div>
        </section>

        <section className="relative mx-auto max-w-[var(--content-max)] py-16 sm:py-24"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><SectionHeading {...messages.problem} /><div className="grid gap-3">{messages.problem.pains.map((pain, index) => <div key={pain} className="qualifyr-glass flex items-start gap-4 rounded-[var(--radius-xl)] p-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--danger-soft)] text-sm font-black text-destructive">{index + 1}</span><p className="font-semibold leading-7">{pain}</p></div>)}</div></div></section>

        <section id="produit" className="relative mx-auto max-w-[var(--content-max)] scroll-mt-24 py-16 sm:py-24"><SectionHeading eyebrow={messages.demo.eyebrow} title={messages.demo.title} description={messages.demo.description} centered /><div className="mt-10"><ProductDemo /></div></section>

        <section className="relative mx-auto max-w-[var(--content-max)] py-16 sm:py-24"><SectionHeading eyebrow={messages.outcomes.eyebrow} title={messages.outcomes.title} centered /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{messages.outcomes.items.map((item, index) => { const Icon = outcomeIcons[index] ?? SearchCheck; return <article key={item.title} className="qualifyr-glass rounded-[var(--radius-2xl)] p-6"><span className="grid size-11 place-items-center rounded-full bg-[var(--primary-soft)] text-primary"><Icon aria-hidden="true" /></span><h3 className="mt-5 text-xl font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></article>; })}</div></section>

        <section id="metiers" className="relative mx-auto max-w-[var(--content-max)] scroll-mt-24 py-16 sm:py-24"><SectionHeading eyebrow={messages.audiences.eyebrow} title={messages.audiences.title} centered /><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{messages.audiences.items.map((item, index) => { const Icon = audienceIcons[index] ?? Wrench; return <div key={item} className="qualifyr-glass flex items-center gap-4 rounded-[var(--radius-xl)] p-5"><span className="grid size-10 place-items-center rounded-full bg-[var(--primary-soft)] text-primary"><Icon aria-hidden="true" /></span><p className="font-bold">{item}</p></div>; })}</div></section>

        <section className="relative mx-auto max-w-[var(--content-max)] py-16 sm:py-24"><SectionHeading eyebrow={messages.difference.eyebrow} title={messages.difference.title} centered /><div className="mt-10 grid gap-5 lg:grid-cols-3">{messages.difference.items.map((item) => <article key={item.title} className="qualifyr-glass rounded-[var(--radius-2xl)] p-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{item.title}</p><p className="mt-4 leading-7 text-muted-foreground">{item.description}</p></article>)}</div></section>

        <section id="securite" className="relative mx-auto max-w-[var(--content-max)] scroll-mt-24 py-16 sm:py-24"><div className="qualifyr-glass grid gap-10 rounded-[var(--radius-3xl)] p-6 sm:p-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><span className="grid size-14 place-items-center rounded-[var(--radius-xl)] bg-primary text-[var(--on-dark)] shadow-[var(--shadow-primary)]"><LockKeyhole aria-hidden="true" /></span><div className="mt-6"><SectionHeading eyebrow={messages.trust.eyebrow} title={messages.trust.title} /></div></div><ul className="grid gap-3 sm:grid-cols-2">{messages.trust.items.map((item) => <li key={item} className="flex items-start gap-3 rounded-[var(--radius-lg)] border bg-[var(--glass)] p-4 text-sm font-semibold leading-6"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{item}</li>)}</ul></div></section>

        <div className="relative mx-auto max-w-[var(--content-max)]"><PricingSection /></div>

        <section className="relative mx-auto max-w-4xl py-16 sm:py-24"><SectionHeading eyebrow={messages.faq.eyebrow} title={messages.faq.title} centered /><div className="mt-10 grid gap-3">{messages.faq.items.map((item) => <details key={item.question} className="group qualifyr-glass rounded-[var(--radius-xl)] p-5"><summary className="focus-ring cursor-pointer list-none rounded font-bold marker:hidden">{item.question}<span className="float-right text-primary transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{item.answer}</p></details>)}</div></section>

        <section className="relative mx-auto max-w-[var(--content-max)] py-16 sm:py-24"><div className="overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-6 text-center shadow-[var(--shadow-primary)] sm:p-12"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--primary-strong)]">{messages.finalCta.eyebrow}</p><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.045em] sm:text-5xl">{messages.finalCta.title}</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">{messages.finalCta.description}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link href="/inscription?plan=professional">{messages.finalCta.action}<ArrowRight aria-hidden="true" /></Link></Button><Button asChild size="lg" variant="glass"><a href="mailto:qualifyragence@gmail.com?subject=Découvrir Qualifyr AI">{messages.finalCta.contact}</a></Button></div></div></section>
      </div>

      <footer className="border-t px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-[var(--content-max)] flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center"><Link href="/" className="flex items-center gap-2 font-bold text-foreground"><BrandMark className="size-7" />Qualifyr AI</Link><p className="sm:ml-auto">Qualification opérationnelle contrôlée par l’humain.</p><a className="focus-ring rounded hover:text-foreground" href="mailto:qualifyragence@gmail.com">Contact</a></div></footer>
    </main>
  );
}
