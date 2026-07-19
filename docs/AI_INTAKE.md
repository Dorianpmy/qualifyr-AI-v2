# AI Intake interne

AI Intake transforme un message libre interne en suggestions reliées au Playbook du Dossier. Le flux est : session privée → message utilisateur immuable → extraction structurée → validation Zod → fusion transactionnelle → question déterministe → réponse courte → recalcul du moteur de qualification.

Le provider par défaut est `disabled` : le message reste enregistré et aucun fait n’est modifié. `vercel-ai-gateway` active l’adapter AI SDK v6 avec modèle, timeout, température et tokens configurables. Les tests utilisent `DeterministicIntakeProvider` sans réseau.

Le contexte est minimisé à la locale, aux services actifs du tenant, au Playbook publié attaché, aux valeurs connues, aux faits confirmés et aux six derniers messages. Il n’existe aucune route publique, aucun upload, aucune action externe et aucun cache partagé.

Le scénario Namur extrait ville, période, surface et service probable, mais « je peux envoyer des photos » ne devient jamais une preuve reçue. La qualification reste `incomplete`; même complète, elle reste `needs_review` avant validation owner/admin.
