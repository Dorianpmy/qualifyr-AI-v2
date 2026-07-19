# Dashboard d’organisation

## Route et layout

`/app/[organizationSlug]` est le dashboard privé. Le layout dynamique résout le slug côté serveur, exige un membership actif, puis fournit uniquement le contexte d’affichage autorisé au shell responsive. Modifier le slug dans l’URL ne constitue jamais une autorisation.

La sidebar desktop et le drawer mobile exposent les routes réellement disponibles : Accueil, Dossiers et Membres. La topbar contient le sélecteur d’organisation, le thème et la déconnexion. Aucune route vide n’est créée pour les fonctions futures.

## Service et DTO

`getOrganizationDashboard` est l’agrégateur serveur. Son DTO contient les paramètres de l’organisation, le rôle et le prénom de l’utilisateur courant, les compteurs d’équipe autorisés ainsi que les compteurs réels de Dossiers actifs et à traiter et les cinq Dossiers récents. Il ne contient ni coordonnées de demandeur, ni demande originale, ni email de membre, ni token, ni hash, ni objet Supabase brut.

Les membres ordinaires ne déclenchent aucune lecture des invitations et reçoivent `null` pour ce compteur. Les owners et admins reçoivent uniquement le nombre d’invitations en attente.

## Configuration et prochaine action

La readiness est calculée, jamais stockée. Les étapes obligatoires sont : compte, organisation, paramètres régionaux et propriétaire actif. Le profil et l’invitation d’équipe sont facultatifs. Le résultat est `needs_setup`, `ready` ou `ready_with_optional_steps`, sans score opaque.

La recommandation est déterministe : paramètres obligatoires manquants, invitation lorsque la taille déclarée suppose plusieurs utilisateurs, ou consultation de l’équipe. Elle n’est jamais présentée comme une recommandation IA.

## Cache, confidentialité et limites

Le dashboard utilise les Server Components et le client Supabase SSR à chaque requête. Aucun `use cache`, cache public, stockage navigateur ou requête client de reconstruction n’est utilisé. Les mutations de membres et invitations conservent leurs invalidations de route existantes.

Les métriques Dossiers sont calculées sur des lignes réellement accessibles : actif signifie non archivé et non clôturé ; à traiter signifie `new`, `incomplete` ou `needs_review`. Aucun graphique, tendance, pourcentage, score ou résultat IA n’est inventé. La modification du profil et des paramètres d’organisation reste hors périmètre.

## Vérification manuelle

Avec Supabase local et des identités `example.test`, créer une organisation française puis une organisation polonaise, naviguer entre elles, vérifier dates/fuseaux/devises, inviter un membre et contrôler le compteur. Un compte extérieur doit obtenir la même réponse sûre pour un slug inexistant et un slug étranger. Tester le drawer, le focus, les thèmes et l’absence de débordement à largeur mobile.
