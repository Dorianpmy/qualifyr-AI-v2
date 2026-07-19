export const planIds = ["essential", "professional", "enterprise"] as const;

export type PlanId = (typeof planIds)[number];

export type Plan = {
  id: PlanId;
  name: string;
  audience: string;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
};

export const plans: readonly Plan[] = [
  {
    id: "essential",
    name: "Essentiel",
    audience: "Pour structurer les premières demandes",
    description: "Le socle Qualifyr pour une petite équipe de services.",
    features: ["Dossiers centralisés", "Services configurables", "Qualification déterministe"],
  },
  {
    id: "professional",
    name: "Professionnel",
    audience: "Pour industrialiser la qualification",
    description: "Un espace complet pour les équipes qui traitent davantage de demandes.",
    features: ["Tout Essentiel", "Playbooks avancés", "AI Intake contrôlé"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    audience: "Pour les organisations aux besoins spécifiques",
    description: "Un accompagnement adapté aux déploiements plus exigeants.",
    features: ["Tout Professionnel", "Accompagnement dédié", "Déploiement sur mesure"],
  },
] as const;

export function isPlanId(value: string | undefined): value is PlanId {
  return planIds.some((planId) => planId === value);
}

export function getPlan(planId: string | undefined) {
  return isPlanId(planId) ? plans.find((plan) => plan.id === planId) : undefined;
}
