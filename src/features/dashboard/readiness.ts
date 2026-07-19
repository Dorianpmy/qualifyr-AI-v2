import type { OrganizationRole } from "@/features/organizations/permissions";

export type SetupStep = {
  key: "account" | "organization" | "regional" | "owner" | "profile" | "team";
  label: string;
  completed: boolean;
  optional: boolean;
};

export type SetupStatus = {
  state: "needs_setup" | "ready" | "ready_with_optional_steps";
  completedRequired: number;
  requiredCount: number;
  steps: SetupStep[];
};

export type ReadinessInput = {
  organizationCreated: boolean;
  regionalSettingsComplete: boolean;
  role: OrganizationRole;
  profileComplete: boolean;
  hasPendingInvitation: boolean;
  hasActiveOwner: boolean;
  expectsMultipleUsers: boolean;
  activeMembersCount: number;
};

export function calculateOrganizationReadiness(input: ReadinessInput): SetupStatus {
  const steps: SetupStep[] = [
    { key: "account", label: "Compte créé", completed: true, optional: false },
    { key: "organization", label: "Organisation créée", completed: input.organizationCreated, optional: false },
    { key: "regional", label: "Paramètres régionaux définis", completed: input.regionalSettingsComplete, optional: false },
    { key: "owner", label: "Propriétaire configuré", completed: input.hasActiveOwner, optional: false },
    { key: "profile", label: "Profil complété", completed: input.profileComplete, optional: true },
    { key: "team", label: "Équipe invitée", completed: input.hasPendingInvitation || input.activeMembersCount > 1, optional: true },
  ];
  const required = steps.filter((step) => !step.optional);
  const completedRequired = required.filter((step) => step.completed).length;
  const requiredReady = completedRequired === required.length;
  return {
    state: requiredReady ? (steps.every((step) => step.completed) ? "ready" : "ready_with_optional_steps") : "needs_setup",
    completedRequired,
    requiredCount: required.length,
    steps,
  };
}

export type RecommendedAction = {
  title: string;
  description: string;
  href: string | null;
  label: string | null;
};

export function getNextRecommendedAction(input: ReadinessInput, organizationSlug: string): RecommendedAction {
  if (!input.regionalSettingsComplete) return {
    title: "Vérifiez les paramètres de votre organisation",
    description: "Certains paramètres régionaux obligatoires sont manquants.",
    href: "#organisation",
    label: "Voir les paramètres",
  };
  if (input.expectsMultipleUsers && input.activeMembersCount === 1 && !input.hasPendingInvitation && input.role !== "member") return {
    title: "Ajoutez un collaborateur",
    description: "Votre taille d’équipe indique que cet espace sera utilisé à plusieurs.",
    href: `/app/${organizationSlug}/membres`,
    label: "Gérer l’équipe",
  };
  return {
    title: "Consultez les Dossiers de l’organisation",
    description: input.profileComplete
      ? "Retrouvez les demandes récentes, incomplètes ou en attente de validation."
      : "Votre profil reste facultatif et pourra être complété dans une prochaine amélioration.",
    href: `/app/${organizationSlug}/dossiers`,
    label: "Voir les Dossiers",
  };
}
