# Matrice de tests Phase 7

| Risque | Couverture |
| --- | --- |
| Lecture inter-tenant | pgTAP vérifie qu’un owner B ne voit aucun Playbook A |
| Écriture directe | pgTAP vérifie le refus sur les versions |
| Permissions | pgTAP refuse configuration et validation finale à un membre |
| Version publiée | trigger d’immutabilité et création d’une version suivante |
| Association | RPC accepte uniquement une version publiée du même tenant |
| Qualification | Vitest couvre champs, preuves, couverture, contact et action suivante |
| Scénario Namur | pgTAP vérifie `incomplete` sans photo, `needs_review` avec photo, puis `qualified` après validation owner |
| Schéma | Zod vérifie types, limites et unicité des clés ; PostgreSQL vérifie structure et taille |

Commandes : `npm run check`, `npm run build`, `npm run db:reset`, `npm run db:test` et `git diff --check`.
