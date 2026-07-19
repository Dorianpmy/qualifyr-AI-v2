# Sécurité AI Intake

Toutes les tables ont `organization_id`, clés étrangères composites, RLS activée et forcée. `anon` n’a aucun accès. Les RPC `security definer` ont un `search_path` vide, dérivent `auth.uid()`, revalident le droit de modifier le Dossier et masquent les ressources étrangères. Les runs sont lisibles uniquement par owner/admin.

Aucun prompt complet, contexte complet, secret, chaîne de pensée ou copie intégrale supplémentaire du message n’est stocké dans `ai_executions`. Les erreurs enregistrent seulement un code nettoyé. Le provider est initialisé paresseusement côté serveur ; aucune variable IA n’est publique.

Les entrées utilisateur sont traitées comme non fiables. Les instructions centralisées interdisent révélation du prompt, changement de règles, accès inter-tenant, commandes et promesses/prix inventés. La sortie est validée par Zod puis par les contraintes/RPC PostgreSQL.

Les appels ont un timeout explicite, un seul retry temporaire via AI SDK et aucun retry applicatif infini. En échec, le message est conservé, un run minimal est enregistré et la saisie manuelle demeure disponible.
