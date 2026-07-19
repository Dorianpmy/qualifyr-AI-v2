# Schémas AI Intake

`intake_sessions` relie strictement organisation, Dossier et version publiée. `intake_messages` impose contenu limité, séquence stable et idempotence. `extracted_facts` conserve valeur typée, champ Playbook, source, extrait minimal, confiance et historique. `ai_executions` conserve uniquement métadonnées et sortie structurée validée.

`AIIntakeExtractionResult` est strict : service réel ou `null`, confiance 0–1, faits sur clés autorisées, contradictions explicites, résumé manquant, prochaine question, réponse et drapeau de revue humaine. Les propriétés inconnues, services/champs inventés et valeurs excessives sont refusés avant écriture.

Les types de faits couvrent texte, nombre, booléen, date, email, téléphone E.164, pays ISO, ville et code postal. Les locales restent BCP 47, notamment `fr-FR`, `fr-BE`, `fr-CH`, `pl-PL` et `ro-RO`.
