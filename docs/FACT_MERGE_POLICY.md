# Politique de fusion des faits

- Nouveau fait : création `suggested` avec message source.
- Même valeur : aucune duplication.
- Nouvelle valeur face à une suggestion : les deux deviennent visibles comme conflit.
- Nouvelle valeur face à un fait confirmé : le confirmé reste prioritaire et la nouvelle valeur devient `conflicted`.
- Confirmation humaine : nouvelle version `confirmed`, anciennes versions `superseded`.
- Correction humaine : valeur manuelle confirmée, auteur conservé, historique préservé.
- Rejet : statut `rejected`, jamais synchronisé dans les valeurs structurées.

Seuls les faits confirmés sont synchronisés pour recalculer la qualification. Une extraction IA ne peut donc jamais écraser une correction humaine ni qualifier automatiquement un Dossier.
