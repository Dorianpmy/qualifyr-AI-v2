# Pilote WhatsApp Qualifyr

## Parcours couvert

Le webhook reçoit les textes, images et PDF du numéro pilote. Les textes alimentent AI Intake, qui extrait uniquement les champs autorisés par le Playbook et choisit la prochaine question. Les médias sont téléchargés depuis Meta avec authentification, limités à 15 Mo et stockés dans le bucket privé `whatsapp-media`.

La qualification finale reste humaine. Une panne ou une absence de crédits IA ne fait pas perdre la demande : Qualifyr conserve le message, répond avec un parcours de secours et crée une alerte opérationnelle.

## Variables privées

Configurer dans Vercel Production et Preview, jamais dans Git :

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_API_VERSION`
- `WHATSAPP_PILOT_ORGANIZATION_ID`
- `WHATSAPP_PILOT_PLAYBOOK_VERSION_ID`
- `AI_PROVIDER=vercel-ai-gateway` après activation des crédits AI Gateway
- `AI_MODEL=openai/gpt-5.4`

Après toute modification, redéployer la production.

## Sécurité et exploitation

1. Faire tourner immédiatement tout jeton copié dans un chat ou une capture.
2. Utiliser un jeton utilisateur système permanent avec les droits strictement nécessaires.
3. Conserver le bucket privé et ne jamais rendre les objets publics.
4. Vérifier régulièrement la page **Canal WhatsApp** de Qualifyr.
5. Tester texte, photo, PDF, doublon webhook et indisponibilité IA avant chaque évolution importante.
