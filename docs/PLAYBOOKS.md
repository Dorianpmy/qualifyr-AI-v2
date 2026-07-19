# Playbooks et services

Un `ServiceDefinition` décrit une prestation proposée par une organisation. Ses `CoverageArea` utilisent un pays ISO 3166-1 alpha-2 et une portée `country`, `city` ou `postal_code`. Un `Playbook` appartient à un service et possède des `PlaybookVersion` numérotées.

Les owners et admins créent services, zones et Playbooks, modifient un unique brouillon puis le publient. Une version publiée est immuable au niveau PostgreSQL. Une nouvelle évolution crée une nouvelle version ; les Dossiers déjà associés conservent leur version exacte.

Les membres actifs lisent le catalogue et peuvent associer/saisir une qualification seulement lorsqu’ils ont déjà le droit de modifier le Dossier. Les tables refusent toute écriture directe : les mutations passent par des RPC `security definer` qui dérivent l’utilisateur de `auth.uid()` et revalident le tenant et le rôle.

Le Playbook de démonstration « Demande de devis rénovation » contient 14 champs, une preuve photo, les règles demandées et l’action « Visite technique recommandée ». Son installation ajoute une couverture Namur au service choisi et publie immédiatement la version 1.
