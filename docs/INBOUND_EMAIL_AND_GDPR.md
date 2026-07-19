# Canal email entrant et conformité européenne

## Parcours

Email volontairement transféré → webhook Resend signé → Dossier organisationnel idempotent → extraction IA facultative → faits suggérés et informations manquantes → validation humaine.

## Activation production

1. Utiliser un sous-domaine dédié, par exemple `inbound.qualifyrai.com`, sans modifier les MX de la messagerie principale.
2. Vérifier ce sous-domaine chez Resend et enregistrer le webhook `email.received` vers `/api/webhooks/resend`.
3. Configurer `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` et `INBOUND_EMAIL_DOMAIN` uniquement côté serveur.
4. Appliquer la migration Supabase et vérifier les advisors.
5. Signer un DPA article 28 avec le client et publier la liste complète des sous-traitants.
6. Documenter les régions d’hébergement et les garanties de transferts hors EEE, le cas échéant.
7. Ajouter l’identité juridique de l’éditeur aux documents publics.
8. Définir les durées contractuelles de conservation des Dossiers et une procédure de suppression/export.
9. Tester la réponse aux violations, les droits des personnes et la révocation d’un canal.

## Limites volontaires

- Aucun accès à la boîte mail complète.
- Aucune réponse automatique au demandeur.
- Aucun fait IA confirmé automatiquement.
- Les pièces jointes sont comptabilisées mais ne sont pas téléchargées ni analysées dans cette version.
- Le contenu complet n’est pas dupliqué dans la table d’audit email ; il réside dans le Dossier.
