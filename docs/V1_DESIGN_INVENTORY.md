# Inventaire visuel de Qualifyr V1

## Référence consultée

Projet lu sans modification :

`/Users/dorian/Documents/Codex/2026-07-15/je-veux-cr-er-un-saas/outputs/qualifyr-ai`

Fichiers consultés :

- `index.html` : structure du shell, navigation, topbar, modale et toast.
- `styles.css` : tokens, surfaces, dimensions, composants, animations et responsive.
- `favicon.svg` : construction et proportions du symbole Qualifyr.

Les API, moteurs, migrations, modèles, permissions, secrets et fichiers métier n’ont pas été utilisés.

## Signaux visuels stables

- Fond chaud : `#f8f5ee`, avec surface élevée `#fffdf9`.
- Surfaces principales blanches et texte presque noir.
- Sidebar noire avec surfaces blanches translucides.
- Bordure chaude `#ece8e1`.
- Texte secondaire `#6e6e6e`.
- Rayons : 10, 14, 18, 20, 22 et 28 px.
- Cartes : ombre `0 16px 44px rgba(17,17,17,.055)` ; hover `0 22px 58px rgba(17,17,17,.085)`.
- Navigation V1 historique : sidebar de 272 px, items de 48 px et topbar spacieuse. Les dernières surcharges CSS transforment aussi la navigation desktop en dock glass ; V2 conserve la sidebar demandée par le brief.
- Espacements principaux : 6, 10, 14, 18, 24, 32 et 44 px.
- Mouvement principal : 200 ms, `cubic-bezier(.2,.8,.2,1)`.
- Glass historique : blur compris entre 22 et 28 px sur les grandes surfaces flottantes, avec saturation mesurée.
- Typographie : pile système sans-serif, titres très serrés et graisses fortes.

## Couleur de marque

Le fichier V1 contient plusieurs couches contradictoires : orange dans ses premières autorités visuelles, puis vert dans des surcharges plus récentes. Il ne fournit pas de token mauve stable. Le brief Phase 2 demande explicitement « le mauve, le blanc et le noir » ; cette instruction est donc l’autorité retenue pour le primaire V2, avec `#8b5cf6` et `#6d28d9`.

## Composants visuellement réutilisables

- App shell, sidebar, topbar et navigation mobile.
- Boutons primaire, secondaire, ghost et icône.
- Cartes, badges, champs, tables, modales et toast.
- États vides, skeletons et surfaces glass.

## Éléments volontairement exclus

- CRM, leads et pipeline.
- Copilotes, agents et automatisations.
- API, routes métier et services.
- Base de données, migrations et permissions.
- Authentification, paiements et secrets.
- Correctifs historiques et dépendances de V1.
