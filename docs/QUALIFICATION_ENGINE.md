# Moteur de qualification déterministe

Le moteur ne fait aucun appel IA. `calculate_dossier_qualification` charge côté serveur la version publiée attachée au Dossier, ignore tout schéma envoyé par le navigateur, puis évalue : service actif, zone couverte, champs requis, preuves minimales et présence d’un contact.

Le résultat persiste la complétude, les informations manquantes, les règles réussies/échouées, l’action suivante et une version d’évaluation. Il recommande `incomplete` dès qu’une information ou règle manque, sinon `needs_review`. Seul un owner/admin peut effectuer la validation humaine finale et produire `qualified`.

Les valeurs acceptées par la Server Action sont limitées aux clés du schéma publié. Les preuves sont pour cette phase des références déclarées et comptées ; aucun stockage ni téléversement public n’est construit. Une future phase devra remplacer ces références par des objets de stockage privés vérifiés sans changer le contrat du moteur.

AI Intake ne remplace pas ce moteur. Après chaque extraction ou résolution humaine, seules les valeurs confirmées sont fusionnées avec les valeurs structurées existantes, puis `calculate_dossier_qualification` est rappelé. Une photo annoncée dans un message reste absente de `evidence_values`; l’IA ne produit jamais directement `qualified`.
