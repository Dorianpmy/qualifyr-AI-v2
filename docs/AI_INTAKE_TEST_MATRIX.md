# Matrice de tests AI Intake

| Risque | Test |
| --- | --- |
| Sortie invalide/inconnue | Vitest refuse propriétés, service et champ inventés, confiance hors limites |
| Fusion | Vitest couvre nouveau, identique, plus précis, contradiction et priorité humaine |
| Question | Vitest couvre conflit, service incertain et question non répétée |
| Namur/i18n | Adapter déterministe testé sur FR/BE/CH/PL/RO ; ville, octobre et 8 m² extraits |
| Règles dures | Photo annoncée absente → `incomplete`; complet → `needs_review`, jamais `qualified` |
| Persistance | pgTAP couvre session, message, idempotence, sortie, faits, provenance et run |
| Permissions | pgTAP couvre owner, membre assigné, run manager-only et anon |
| Multi-tenant | pgTAP interdit lectures, écritures et découverte A/B |
| Migration | reset base vide et rejeu après Phases 1–7 |
| E2E interne | build route privée + parcours transactionnel SQL et orchestration déterministe |

Le navigateur authentifié complet reste un contrôle manuel local : aucune identité de test persistante n’est livrée au dépôt.
