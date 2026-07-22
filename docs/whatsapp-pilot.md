# Pilote WhatsApp Cloud API

Ce pilote relie un unique numéro WhatsApp Business appartenant à Qualifyr à une organisation et à une version publiée de Playbook. Il reçoit uniquement les messages texte, crée ou reprend un Dossier par numéro, exécute AI Intake et répond avec la prochaine question. Les faits restent des suggestions soumises à validation humaine.

## Configuration privée

Ajouter dans Vercel, sans jamais les committer :

```env
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=
WHATSAPP_PILOT_ORGANIZATION_ID=
WHATSAPP_PILOT_PLAYBOOK_VERSION_ID=
```

Toutes les variables doivent être présentes pour activer le pilote. `WHATSAPP_GRAPH_API_VERSION` doit être la version explicitement choisie dans Meta, par exemple `vXX.X`; l’application ne choisit pas automatiquement une version potentiellement incompatible.

## Configuration Meta

1. Déployer la migration et l’application.
2. Dans Meta for Developers, déclarer le callback `https://<domaine>/api/webhooks/whatsapp`.
3. Utiliser la même valeur privée pour le Verify Token dans Meta et Vercel.
4. Abonner l’application au champ `messages` du compte WhatsApp Business.
5. Envoyer un message texte au numéro pilote et confirmer la création du Dossier puis la réponse.

Les requêtes POST sont vérifiées avec `x-hub-signature-256` et le secret de l’application avant tout traitement. Les identifiants de messages entrants sont uniques en base afin que les nouvelles livraisons Meta ne créent pas de doublons.

## Limites volontaires

- un seul numéro et une seule organisation pilote ;
- messages texte uniquement ;
- pas de pièces jointes, audio, modèles marketing ou onboarding multi-entreprises ;
- si l’IA est désactivée, le Dossier est conservé et un accusé de réception neutre est envoyé ;
- l’entreprise conserve la validation finale des informations extraites.
