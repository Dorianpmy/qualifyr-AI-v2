# Dossiers de demande de service

## Modèle canonique

`service_requests` est le premier cœur métier de Qualifyr AI V2. Chaque ligne appartient obligatoirement à une `organization`, possède un UUID interne et une référence opaque stable `D-XXXXXXXXXX`, générée côté serveur et unique dans l’organisation. `creation_request_id` rend la création idempotente pour un utilisateur et une organisation.

Les champs couvrent le titre, la demande originale, le libellé de service, la source, le statut, les coordonnées minimales du demandeur, sa locale, l’adresse internationale, l’assignation, les auteurs, les dates UTC, l’archivage et `lock_version`. L’email est normalisé en minuscules, le téléphone suit E.164 et le pays ISO 3166-1 alpha-2. Le code postal reste une chaîne. Au moins un email ou un téléphone est requis. Seule la source `manual` est utilisable ; les autres valeurs préparent des migrations additives futures.

## Routes et interface

- `/app/[organizationSlug]/dossiers` : recherche serveur, filtres statut/responsable/pays/archives, tri et pagination ;
- `/app/[organizationSlug]/dossiers/nouveau` : création manuelle ;
- `/app/[organizationSlug]/dossiers/[reference]` : détail, édition autorisée, actions et historique ;
- `/app/[organizationSlug]/dossiers/[reference]/export` : téléchargement JSON privé, sans cache.

Les Server Components ne reçoivent que des DTO minimisés. La liste n’expose ni demande originale, ni email, ni téléphone, ni adresse. Les recherches sont paramétrées par la fonction `list_service_requests`; aucune saisie n’est interpolée dans du SQL. Il n’existe aucun cache public ou partagé : chaque lecture privée est réautorisée et scoppée à la requête.

## Formulaire et internationalisation

Le formulaire réutilisable valide avec Zod côté serveur et avec les contraintes HTML fondamentales côté navigateur. Les dates sont stockées en UTC et rendues selon la locale BCP 47 et le fuseau IANA de l’organisation. Les pays proposés viennent du registre extensible existant ; la base n’est pas limitée aux marchés francophones.

## Attribution, archivage, export et suppression

Seuls owner/admin attribuent ou désattribuent un membre actif de la même organisation. L’archivage conserve le statut et l’historique ; la restauration est réservée à owner/admin. L’export JSON est réservé à owner/admin, généré à la demande, non public, non mis en cache et journalisé sans contenu personnel dans l’événement.

La suppression définitive est réservée à owner et exige la référence exacte. La transaction supprime le Dossier et ses événements par cascade. Les phases ajoutant fichiers, embeddings, jobs ou mémoires devront obligatoirement étendre cette transaction avant d’autoriser leur suppression.

## Préparation Playbooks et limites

`service_label` demeure volontairement un texte court. Il n’existe ni Playbook, ni `ServiceDefinition`, ni fait extrait, qualification, intake public ou appel IA. `qualified` et `routed` existent dans l’enum pour compatibilité future mais restent impossibles à sélectionner et à atteindre par les RPC Phase 6. Une future migration pourra ajouter des relations structurées sans transformer la demande en payload JSON opaque.
