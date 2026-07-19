# Sécurité multi-tenant

## Défenses

La sécurité combine quatre niveaux : session Supabase validée côté serveur, chargement explicite par utilisateur et slug, RPC autorisés, puis RLS forcée. Une absence de membership actif produit une page introuvable afin de ne pas révéler l’existence d’une organisation privée.

Les données privées ne sont pas mises en cache globalement. Les Server Components relisent les memberships à chaque requête importante et un utilisateur retiré perd donc l’accès dès la requête suivante.

## Mutations atomiques

Les fonctions `create_organization_with_owner`, `create_organization_invitation`, `accept_organization_invitation`, `update_organization_member_role`, `remove_organization_member` et `revoke_organization_invitation` sont transactionnelles. Elles utilisent `SECURITY DEFINER` avec `search_path = ''`, contrôlent `auth.uid()`, qualifient chaque relation et sont explicitement interdites à `anon`.

La création possède une clé d’idempotence unique par créateur. L’acceptation verrouille l’invitation, compare l’email Auth, crée ou réactive le membership et consomme le token dans la même transaction.

## RLS et privilèges

- une organisation est lisible uniquement par ses membres actifs ;
- les memberships sont lisibles uniquement dans une organisation accessible ;
- les invitations sont visibles uniquement par `owner` et `admin` ;
- `token_hash` ne dispose d’aucun privilège `SELECT` pour le rôle authentifié ;
- aucune table privée n’est lisible ou modifiable par `anon` ;
- les écritures directes sont révoquées et passent par les RPC contrôlés.

La clé publiable est utilisée avec RLS. Aucune clé `service_role`/secrète n’est créée ou envoyée au navigateur.

## Dossiers privés

`service_requests` et `service_request_events` activent et forcent RLS. Les lectures exigent un membership actif et les tables refusent toute écriture directe aux rôles API. Les RPC de création, modification, transition, assignation, archivage, export et suppression redérivent l’utilisateur, l’organisation et le rôle. Les versions empêchent les écrasements concurrents et une assignation étrangère ou inactive est rejetée.

La liste et le dashboard utilisent des DTO minimisés et aucune donnée privée n’est placée dans un cache partagé. La référence opaque n’est jamais considérée comme une autorisation.

## Dashboard privé

Le layout `/app/[organizationSlug]` résout l’organisation et le membership actif avant de rendre le shell. `getOrganizationDashboard` réutilise ce contrôle, scope chaque lecture par l’organisation autorisée et réduit le DTO selon le rôle. Le slug, le sélecteur et la navigation ne sont jamais des autorisations.

Le dashboard ne possède aucun cache partagé. Les invitations ne sont pas interrogées pour un membre ordinaire ; les managers reçoivent uniquement un compteur, jamais les tokens ou le détail des destinataires. Les aperçus d’équipe excluent les emails.

## Tests A/B

Les tests pgTAP créent deux organisations, leurs propriétaires et membres, puis vérifient l’impossibilité de lire, inviter, modifier, attribuer ou supprimer au-delà de la frontière. Ils couvrent aussi idempotence, rôles, versions, transitions, archivage, export, dernier propriétaire, tokens d’invitation et perte d’accès après retrait.

## Parcours manuel local

1. Lancer Supabase et l’application localement.
2. Créer `phase4-owner@example.test`, terminer l’onboarding avec une organisation française et vérifier le rôle propriétaire.
3. Créer une seconde organisation polonaise ou roumaine et utiliser le sélecteur.
4. Créer une invitation pour `phase4-member@example.test`, copier le lien affiché puis se déconnecter.
5. Créer le second compte synthétique avec exactement cette adresse et ouvrir le lien.
6. Vérifier l’accès et le rôle, puis retirer le membre depuis la session propriétaire.
7. Recharger l’ancienne URL dans la session du membre : l’accès doit être refusé immédiatement.

Ne jamais utiliser d’identité réelle, de base distante ou d’email externe.
