"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { marketConfig, type MarketCode } from "@/config/i18n";
import { organizationMessages as messages } from "@/features/organizations/messages";
import { normalizeSlug } from "@/features/organizations/schemas";
import { initialOrganizationActionState } from "@/features/organizations/state";
import { createOrganizationAction } from "@/server/actions/organizations";

const categories = Object.entries(messages.categories);
const teamSizes = Object.entries(messages.teamSizes);

export function OnboardingForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createOrganizationAction, initialOrganizationActionState);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [market, setMarket] = useState<MarketCode>("FR");
  const settings = marketConfig[market];
  const [regional, setRegional] = useState<{ locale: string; timezone: string; currency: string; primaryLanguage: string }>({
    locale: marketConfig.FR.locale, timezone: marketConfig.FR.timezone,
    currency: marketConfig.FR.currency, primaryLanguage: marketConfig.FR.primaryLanguage,
  });

  return <Card className="mx-auto w-full max-w-3xl hover:translate-y-0">
    <CardHeader><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-strong">{messages.onboarding.eyebrow} · {step}/3</p><CardTitle>{messages.onboarding.title}</CardTitle><CardDescription>{messages.onboarding.description}</CardDescription></CardHeader>
    <CardContent><form action={action} className="grid gap-6">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="slug" value={slug} />
      {state.message ? <Alert variant="danger" title="Création impossible">{state.message}</Alert> : null}
      <section className={step === 1 ? "grid gap-4" : "hidden"} aria-hidden={step !== 1}>
        <Field label={messages.onboarding.name}><Input name="name" value={name} onChange={(event) => { setName(event.target.value); setSlug(normalizeSlug(event.target.value)); }} maxLength={120} required /></Field>
        <Field label={messages.onboarding.category}><Select name="businessCategory" defaultValue="technical_services" required>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
        <Field label={messages.onboarding.teamSize}><Select name="teamSizeRange" defaultValue="2_5" required>{teamSizes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      </section>
      <section className={step === 2 ? "grid gap-4" : "hidden"} aria-hidden={step !== 2}>
        <Field label={messages.onboarding.country}><Select name="countryCode" value={market} onChange={(event) => { const code = event.target.value as MarketCode; setMarket(code); const next = marketConfig[code]; setRegional({ locale: next.locale, timezone: next.timezone, currency: next.currency, primaryLanguage: next.primaryLanguage }); }}>{Object.entries(marketConfig).map(([code, config]) => <option key={code} value={code}>{config.label}</option>)}</Select></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={messages.onboarding.language}><Input name="primaryLanguage" value={regional.primaryLanguage} onChange={(event) => setRegional((value) => ({ ...value, primaryLanguage: event.target.value }))} required /></Field><Field label={messages.onboarding.locale}><Input name="locale" value={regional.locale} onChange={(event) => setRegional((value) => ({ ...value, locale: event.target.value }))} required /></Field><Field label={messages.onboarding.currency}><Input name="currency" value={regional.currency} onChange={(event) => setRegional((value) => ({ ...value, currency: event.target.value }))} maxLength={3} required /></Field><Field label={messages.onboarding.timezone}><Input name="timezone" value={regional.timezone} onChange={(event) => setRegional((value) => ({ ...value, timezone: event.target.value }))} required /></Field></div>
        <p className="text-xs text-muted-foreground">Ces propositions peuvent être corrigées avant la création.</p>
      </section>
      <section className={step === 3 ? "grid gap-4" : "hidden"} aria-hidden={step !== 3}>
        <div className="grid gap-3 rounded-[var(--radius-lg)] border bg-muted/35 p-5 text-sm"><p><strong>{messages.common.organization} :</strong> {name}</p><p><strong>{messages.onboarding.country} :</strong> {settings.label}</p><p><strong>{messages.onboarding.language} :</strong> {regional.primaryLanguage}</p><p><strong>{messages.onboarding.currency} :</strong> {regional.currency}</p><p><strong>{messages.onboarding.timezone} :</strong> {regional.timezone}</p><p><strong>Rôle :</strong> {messages.onboarding.ownerRole}</p></div>
      </section>
      <div className="flex flex-wrap justify-between gap-3"><Button type="button" variant="ghost" disabled={step === 1 || pending} onClick={() => setStep((value) => Math.max(1, value - 1))}>{messages.onboarding.previous}</Button>{step < 3 ? <Button type="button" disabled={!name.trim()} onClick={() => setStep((value) => Math.min(3, value + 1))}>{messages.onboarding.next}</Button> : <Button type="submit" loading={pending}>{messages.onboarding.submit}</Button>}</div>
    </form></CardContent>
  </Card>;
}
