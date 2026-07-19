export const planIds = ["essential", "professional", "enterprise"] as const;

export type PlanId = (typeof planIds)[number];

export type Plan = {
  id: PlanId;
  name: string;
  audience: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  startingAt?: boolean;
  features: readonly string[];
  highlighted?: boolean;
};

export const plans: readonly Plan[] = [
  {
    id: "essential",
    name: "Essentiel",
    audience: "Pour structurer les premières demandes",
    description: "Le socle Qualifyr pour une petite équipe de services.",
    monthlyPrice: 49,
    annualPrice: 490,
    features: ["3 utilisateurs inclus", "100 Dossiers par mois", "1 Playbook actif", "AI Intake limité"],
  },
  {
    id: "professional",
    name: "Professionnel",
    audience: "Pour industrialiser la qualification",
    description: "Un espace complet pour les équipes qui traitent davantage de demandes.",
    monthlyPrice: 129,
    annualPrice: 1290,
    features: ["10 utilisateurs inclus", "500 Dossiers par mois", "Playbooks illimités", "AI Intake avancé et exports"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    audience: "Pour les organisations aux besoins spécifiques",
    description: "Un accompagnement adapté aux déploiements plus exigeants.",
    monthlyPrice: 349,
    startingAt: true,
    features: ["Utilisateurs et volumes adaptés", "Tout Professionnel", "Accompagnement dédié", "Sécurité et intégrations spécifiques"],
  },
] as const;

export function isPlanId(value: string | undefined): value is PlanId {
  return planIds.some((planId) => planId === value);
}

export function getPlan(planId: string | undefined) {
  return isPlanId(planId) ? plans.find((plan) => plan.id === planId) : undefined;
}
