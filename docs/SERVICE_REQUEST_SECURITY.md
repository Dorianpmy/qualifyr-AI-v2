# Sécurité des Dossiers

## Frontière d’organisation

Les deux tables portent un `organization_id` obligatoire, indexé et référencé. RLS est activée et forcée. `authenticated` dispose uniquement de `SELECT`; toutes les écritures directes sont révoquées. Les politiques de lecture exigent un membership actif. Les RPC `SECURITY DEFINER` utilisent `search_path = ''`, des noms qualifiés, `auth.uid()` et des contrôles de rôle avant chaque mutation. `anon` n’a aucun droit d’exécution.

Le slug, la référence, les champs cachés et l’état de navigation ne sont jamais des autorisations. Le serveur dérive l’organisation depuis le contexte de route autorisé, ignore toute organisation fournie par le navigateur et scope encore les requêtes par UUID d’organisation. Une ressource étrangère produit une réponse introuvable.

## Permissions

| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| lire/créer | oui | oui | oui |
| modifier/changer statut | tous | tous | créé ou attribué |
| attribuer/désattribuer | oui | oui | non |
| archiver | oui | oui | créé ou attribué |
| restaurer/exporter | oui | oui | non |
| supprimer définitivement | oui | non | non |

L’assignation vérifie toujours un membership actif dans la même organisation. Le module `permissions.ts` centralise la présentation UI, mais les RPC restent la barrière d’écriture.

## Données et audit

`service_request_events` ne duplique ni coordonnées, ni demande originale. Ses métadonnées sont limitées à 2 Kio et ne contiennent que transitions et identifiants d’assignation. L’export porte `Cache-Control: private, no-store`, un nom de fichier fondé uniquement sur la référence et aucun secret. Les erreurs utilisateur restent génériques et aucun logger client ne reçoit le contenu du Dossier.
