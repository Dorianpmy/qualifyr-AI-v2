import { Check } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { billingMessages } from "@/features/billing/messages";
import { plans } from "@/features/billing/plans";

export function PricingSection() {
  const messages = billingMessages.pricing;

  return (
    <section id="forfaits" aria-labelledby="pricing-title" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{messages.eyebrow}</p>
        <h2 id="pricing-title" className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">{messages.title}</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{messages.description}</p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.highlighted ? "qualifyr-glass border-[var(--primary-border)] shadow-[var(--shadow-primary)]" : "qualifyr-glass"}>
            <CardHeader className="min-h-52">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {plan.highlighted ? <Badge variant="success">{messages.recommended}</Badge> : null}
              </div>
              <CardDescription>{plan.audience}</CardDescription>
              <div className="pt-5">
                <p className="text-xl font-extrabold text-foreground">{messages.pricePending}</p>
                <p className="mt-1 text-xs text-muted-foreground">{messages.priceHint}</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <ul className="grid gap-3 text-sm" aria-label={`Fonctionnalités du forfait ${plan.name}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-primary"><Check className="size-3" aria-hidden="true" /></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" variant={plan.highlighted ? "default" : "glass"} className="w-full">
                <Link href={`/inscription?plan=${plan.id}`}>{messages.choose}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
