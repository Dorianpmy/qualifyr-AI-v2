export const serviceRequestMessages = {
  title: "Dossiers",
  new: "Nouveau Dossier",
  empty: "Aucun Dossier ne correspond à cette vue.",
  genericError: "L’action n’a pas pu être effectuée. Vérifiez les informations puis réessayez.",
  conflict: "Ce Dossier a été modifié entre-temps. Rechargez la page avant de réessayer.",
  statuses: { new: "Nouveau", collecting: "En collecte", incomplete: "Incomplet", needs_review: "À valider", qualified: "Qualifié", routed: "Transmis", closed: "Clôturé" },
  events: { created: "Dossier créé", updated: "Informations modifiées", status_changed: "Statut modifié", assigned: "Responsable attribué", unassigned: "Responsable retiré", archived: "Dossier archivé", restored: "Dossier restauré", exported: "Dossier exporté", deleted: "Dossier supprimé" },
  channels: { email: "Email", phone: "Téléphone", none: "Aucune préférence" },
  future: "Les Playbooks et la qualification automatique seront ajoutés dans les prochaines phases.",
} as const;
