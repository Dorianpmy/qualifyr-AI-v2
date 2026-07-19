# Machine à états des Dossiers

Le module `features/service-requests/state-machine.ts` et la fonction SQL `transition_service_request_status` appliquent le même graphe. Toute transition exige une version courante et ajoute un événement `status_changed` avec auteur, date, ancien statut, nouveau statut et raison facultative.

| Depuis | Transitions manuelles autorisées |
| --- | --- |
| `new` | `collecting`, `incomplete`, `needs_review`, `closed` |
| `collecting` | `incomplete`, `needs_review`, `closed` |
| `incomplete` | `collecting`, `needs_review`, `closed` |
| `needs_review` | `collecting`, `incomplete`, `closed` |
| `closed` | `new` |
| `qualified` | aucune en Phase 6 |
| `routed` | aucune en Phase 6 |

Passer à `closed` renseigne `closed_at`; rouvrir vers `new` l’efface. `qualified` et `routed` sont réservés aux phases de validation et transmission. Une version obsolète produit `version_conflict` et n’écrit rien.
