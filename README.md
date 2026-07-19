# Qualifyr AI V2

Fondation neuve du produit Qualifyr AI. Le produit est pensé autour du **Dossier** : l’IA comprend, le moteur qualifie, l’humain valide.

Cette étape contient l’authentification Supabase, la fondation multi-tenant, un dashboard réel, les Dossiers, leurs Playbooks versionnés, la qualification déterministe et AI Intake interne. Elle ne contient volontairement aucun intake public, Workflow, CRM ou Agent autonome.

## Stack

- Next.js 16 App Router et React 19, Server Components par défaut
- TypeScript strict, avec contrôles supplémentaires sur les index et propriétés optionnelles
- Tailwind CSS 4 et shadcn/ui (Radix) pour un design system possédé par le projet
- React Hook Form et Zod, installés pour les futurs formulaires typés
- Supabase SSR, Auth, PostgreSQL et RLS
- Vitest pour les tests unitaires
- npm et lockfile versionné pour une installation reproductible

TanStack Query n’est pas installé : le socle n’a pas de besoin de cache client. Il sera ajouté seulement si une future expérience interactive le justifie.

## Démarrage

Prérequis : Node.js 20.9 ou plus récent, npm et Docker pour Supabase local.

```bash
cp .env.example .env.local
npm install
npm run db:start
# reporter les clés locales affichées par Supabase dans .env.local
npm run dev
```

La page est disponible sur `http://localhost:3000` et Supabase Studio sur `http://127.0.0.1:55323`. Les ports Supabase `5532x` évitent de perturber un éventuel projet V1 local déjà actif.

Les parcours d’authentification sont documentés dans [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md). Les Playbooks sont décrits dans les documents `PLAYBOOK*`. AI Intake est détaillé dans [`docs/AI_INTAKE.md`](docs/AI_INTAKE.md), [`docs/AI_INTAKE_SCHEMA.md`](docs/AI_INTAKE_SCHEMA.md), [`docs/FACT_MERGE_POLICY.md`](docs/FACT_MERGE_POLICY.md), [`docs/AI_SECURITY.md`](docs/AI_SECURITY.md) et [`docs/AI_INTAKE_TEST_MATRIX.md`](docs/AI_INTAKE_TEST_MATRIX.md).

## Scripts

| Script | Usage |
| --- | --- |
| `npm run dev` | serveur Next.js local avec Turbopack |
| `npm run build` | build de production Webpack (reproductible dans les environnements contraints) |
| `npm run start` | exécution du build de production |
| `npm run lint` | ESLint, aucun warning accepté |
| `npm run typecheck` | validation TypeScript sans émission |
| `npm test` | tests Vitest une fois |
| `npm run test:watch` | tests Vitest en continu |
| `npm run test:coverage` | couverture de tests |
| `npm run check` | lint, types et tests |
| `npm run db:start` | démarre Supabase local |
| `npm run db:stop` | arrête Supabase local sans sauvegarde |
| `npm run db:reset` | rejoue les migrations locales |
| `npm run db:test` | exécute les tests SQL Supabase |
| `npm run db:types` | régénère les types TypeScript depuis le schéma local |

## Variables d’environnement

| Variable | Portée | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | publique | URL canonique de l’application |
| `NEXT_PUBLIC_SUPABASE_URL` | publique | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publique | clé publiable, protégée par RLS |
| `SUPABASE_SECRET_KEY` | serveur | réservée aux rares opérations privilégiées futures ; ne jamais exposer |
| `AI_PROVIDER` | serveur | `disabled` par défaut ou `vercel-ai-gateway` |
| `AI_MODEL`, `AI_TIMEOUT_MS` | serveur | modèle centralisé et timeout explicite |

La validation est paresseuse : un build purement statique ne crée aucun client externe au chargement des modules. Les secrets ne portent jamais le préfixe `NEXT_PUBLIC_`.

## Architecture

```text
.
├── public/                         # ressources statiques
├── src/
│   ├── app/                        # routes, layouts, metadata et styles globaux
│   ├── components/
│   │   └── ui/                     # primitives shadcn accessibles et personnalisables
│   ├── config/                     # configuration et validation d’environnement
│   ├── db/                         # futurs repositories et requêtes typées
│   ├── features/                   # capacités isolées par domaine, dont service-requests
│   ├── hooks/                      # hooks React réellement transverses
│   ├── lib/                        # adaptateurs techniques réutilisables (Supabase, utils)
│   ├── server/                     # cas d’usage exclusivement serveur et auth context
│   ├── services/
│   │   └── ai/                     # port IA unique, fournisseur désactivé par défaut
│   ├── styles/                     # styles spécialisés futurs
│   ├── types/                      # contrats transverses et types DB générés
│   └── proxy.ts                    # rafraîchissement cookie Supabase, jamais seule barrière auth
├── supabase/
│   ├── config.toml                 # stack Supabase locale
│   ├── migrations/                 # schéma versionné et politiques RLS
│   └── tests/database/              # tests pgTAP des politiques et triggers
├── .env.example                    # contrat de configuration sans secret
├── components.json                # configuration shadcn/ui
├── eslint.config.mjs              # règles Next.js et TypeScript
├── next.config.ts                 # configuration Next.js
├── package.json                   # dépendances et scripts
└── tsconfig.json                  # TypeScript strict
```

### Règles de séparation

- `app/` compose les routes ; la logique n’y vit pas.
- `features/` possède la logique et l’interface propres à chaque capacité.
- `server/` orchestre l’autorisation et les cas d’usage côté serveur.
- `db/` encapsule les lectures/écritures PostgreSQL.
- `services/` encapsule les systèmes externes. Tout futur appel IA passe par `services/ai`.
- `components/ui/` reste métier-agnostique.

## Multi-tenant et sécurité

`Organization` est l’unique tenant canonique. Les organisations, memberships et invitations activent et forcent RLS. Les mutations sensibles utilisent des RPC transactionnels qui dérivent l’identité de `auth.uid()` ; aucune clé privilégiée n’est utilisée par l’application.

Toute table privée, dont `service_requests` et `service_request_events`, contient un `organization_id` non nul, indexé, référencé vers `organizations`, avec RLS forcée et des politiques testées. Le Proxy rafraîchit la session avec `getClaims()`, mais chaque Server Component, Server Action ou Route Handler sensible réautorise l’accès ; RLS reste la dernière barrière.

## Design system

Les composants consomment uniquement des tokens sémantiques (`background`, `primary`, `card`, `border`, etc.). Les effets glass, blur, ombres, rayons, transitions et réduction de mouvement sont centralisés dans `src/app/globals.css`.

Le code de Qualifyr V1 n’était pas présent dans ce workspace. La direction proposée est donc un socle premium provisoire, pas une affirmation de parité visuelle. Pour retrouver **exactement** V1, il faudra fournir une URL, des captures ou ses tokens ; l’audit modifiera les tokens sans réécrire l’architecture.

## Décisions structurantes

- Pas d’ORM à ce stade : Supabase génère déjà un client et des types ; aucune logique métier ne justifie une couche supplémentaire.
- Pas de client Supabase global : chaque client serveur est créé à la demande avec le cookie store de la requête.
- AI Intake passe uniquement par le port centralisé : provider désactivé sûr, AI Gateway optionnel et adapter déterministe de test.
- Pas de `service_role` côté navigateur : seules les clés publiables peuvent être exposées.
- Pas de dashboard fictif : la route d’organisation agrège uniquement des données réelles, y compris les Dossiers actifs, à traiter et récents, dans un DTO serveur minimisé et scoppé.

## Prochaines améliorations proposées

1. Configurer un SMTP de production pour l’authentification et les invitations, puis tester la délivrabilité.
2. Faire valider les textes juridiques (`LEGAL_REVIEW_REQUIRED`).
3. Configurer CI sur `npm run check`, le build et les tests Supabase.
4. Ajouter OAuth, MFA et SSO uniquement dans leurs phases dédiées.
5. Étendre les catalogues i18n lors de l’ouverture d’une nouvelle locale.
# Qualifyr AI V2

## Hub interne

La couche Hub ajoute un registre tenant-scopé de modules, packs métier, agents et intégrations. Consultez [HUB.md](HUB.md) pour le modèle de sécurité, les limites intentionnelles et le diagramme de dépendances.
