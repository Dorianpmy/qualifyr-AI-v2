# Matrice de tests des Dossiers

| Couche | Couverture |
| --- | --- |
| Vitest | schémas internationaux FR/BE/CH/PL/RO, contact requis, E.164, transitions, rôles, listes de statuts |
| pgTAP | tables/politiques, RLS forcée, privilèges, création et idempotence, référence, normalisation, A/B tenant, écriture directe refusée, attribution locale/étrangère, rôle member, concurrence optimiste, transitions, archivage/restauration, export, suppression owner/admin, anon |
| Migration vide | `npm run db:reset` rejoue toutes les migrations depuis zéro |
| Base existante synthétique | la migration additive a été appliquée après les fondations Phases 1–5 et les suites antérieures restent vertes |
| Next.js | lint strict, typecheck strict, tests, build de production |
| Qualité | lint PostgreSQL, `git diff --check`, audit npm, scan de motifs de secrets et contrôle des fichiers suivis |

## Parcours E2E manuel

Se connecter, ouvrir une organisation, créer un Dossier, vérifier le détail, modifier la ville, attribuer un membre, passer à `collecting`, vérifier l’historique et les compteurs dashboard, archiver, filtrer les archives, restaurer, exporter, puis confirmer qu’un compte d’une autre organisation obtient une réponse introuvable. Aucun appel IA ni service externe n’intervient.

Le parcours navigateur dépend d’une session Auth locale. Quand aucune infrastructure E2E persistante n’est disponible, les garanties critiques restent vérifiées au niveau SQL et service ; cette limite doit être signalée dans le rapport de phase.
