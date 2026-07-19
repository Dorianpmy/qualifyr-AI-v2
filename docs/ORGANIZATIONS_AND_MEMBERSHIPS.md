# Organisations et memberships

## Tenant canonique

`public.organizations` représente l’entreprise cliente et constitue l’unique tenant canonique. Aucun concept `Workspace` concurrent n’existe. Toute future ressource privée devra référencer un `organization_id` non nul et appliquer une politique RLS testée.

## Modèles

Une organisation possède un nom, un slug lisible, ses paramètres internationaux, une catégorie générale, une taille d’équipe, son créateur et la date de fin d’onboarding. Le slug aide à la navigation mais ne sert jamais d’autorisation.

Un membership relie un utilisateur Supabase à une organisation avec un rôle `owner`, `admin` ou `member` et un statut `active`, `suspended` ou `removed`. Une invitation reste séparée jusqu’à son acceptation : aucun faux membership actif n’est créé.

## Parcours et routes

- `/app` choisit la destination selon les memberships actifs : onboarding, organisation unique ou sélecteur.
- `/app/onboarding` crée atomiquement l’organisation et son propriétaire.
- `/app/[organizationSlug]` affiche uniquement l’espace minimal scoppé.
- `/app/[organizationSlug]/membres` gère membres et invitations selon le rôle.
- `/invitation/[token]` impose une authentification et accepte l’invitation de manière atomique.

Le sélecteur reçoit exclusivement la liste filtrée côté serveur. Changer d’organisation navigue vers une route dont le membership est revérifié ; la sélection n’est jamais une autorisation.

## Rôles

- `owner` : invite `admin` ou `member`, modifie les rôles ordinaires et retire des membres. Le dernier propriétaire est protégé.
- `admin` : consulte l’équipe, invite et retire uniquement des membres ordinaires.
- `member` : consulte son organisation et ne réalise aucune mutation administrative.

Les helpers de permissions servent à l’interface, mais chaque RPC réapplique les règles dans PostgreSQL.

## Invitations sans email transactionnel

Le serveur génère 256 bits aléatoires, transmet uniquement le hash SHA-256 à PostgreSQL et retourne une fois le lien brut au créateur. Le produit indique honnêtement qu’aucun email n’a été envoyé. Une nouvelle invitation révoque l’invitation encore active pour la même adresse. Le token expire après sept jours, ne peut être réutilisé et l’email authentifié doit correspondre.

## Limites de Phase 4

Pas de transfert de propriété, suppression destructive d’organisation, permissions personnalisées, équipes, département, facturation, Dossier ou dashboard métier. L’envoi automatique des invitations reste conditionné à un futur fournisseur transactionnel.
