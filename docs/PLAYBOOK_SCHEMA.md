# Schéma Playbook v1

Le JSON est limité à 64 Kio et validé par Zod et PostgreSQL.

```json
{
  "fields": [{ "key": "city", "label": "Ville", "type": "city", "required": true, "question": "Dans quelle ville ?" }],
  "proofs": [{ "key": "photos", "label": "Photos", "minimum": 1 }],
  "rules": [{ "type": "coverage_area" }, { "type": "human_validation" }],
  "nextAction": "Planifier une visite technique"
}
```

Types de champ : `text`, `textarea`, `number`, `date`, `select`, `email`, `phone`, `country`, `city`, `postal_code`. Les clés sont stables, uniques et en `snake_case`. Les règles admises sont `service_allowed`, `coverage_area`, `required_field`, `required_photo`, `contact_available`, `human_validation`.

L’éditeur textuel interne encode un champ par ligne sous la forme `clé|libellé|type|oui/non|question`, et une preuve sous la forme `clé|libellé|minimum`.
