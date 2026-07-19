# Authentification

## Périmètre

La Phase 3 fournit l’inscription email/mot de passe, la confirmation email lorsque Supabase l’exige, la connexion, le renouvellement SSR, la déconnexion, la récupération du mot de passe et une zone `/app` minimale. Elle ne crée aucune organisation, permission métier ou donnée de Dossier.

`LEGAL_REVIEW_REQUIRED` : aucune case d’acceptation ni fausse page juridique n’est ajoutée tant que les textes applicables n’ont pas été validés.

## Architecture et routes

- `/connexion`, `/inscription`, `/mot-de-passe-oublie` : routes publiques réservées aux visiteurs ; un utilisateur connecté est redirigé vers `/app`.
- `/reinitialiser-mot-de-passe` : reçoit la session établie par le callback de récupération et refuse la mutation sans claims valides.
- `/auth/callback` : échange un code PKCE contre une session puis accepte uniquement une destination interne sûre.
- `/app` : route privée vérifiée par le proxy puis à nouveau dans son layout serveur.
- `src/server/actions/auth.ts` : mutations serveur centralisées, validation Zod et messages non révélateurs.
- `src/lib/supabase/*` : unique abstraction Supabase browser/serveur/proxy existante.

La session reste dans les cookies gérés par `@supabase/ssr`. Elle n’est jamais recopiée dans `localStorage`. Le proxy appelle `getClaims()` pour valider ou renouveler le JWT et retransmet les cookies rafraîchis. Les composants serveur privés refont une vérification ; PostgreSQL RLS reste la dernière barrière.

## Profil minimal et sécurité

La migration `20260719133820_create_user_profiles.sql` ajoute un profil privé par `auth.users`. Un trigger `security definer`, dont le `search_path` est vide, initialise uniquement les données d’identité et préférences. Les métadonnées utilisateur ne servent jamais à autoriser une action.

RLS est activée et forcée. Le rôle `authenticated` peut lire son profil et mettre à jour seulement les colonnes explicitement autorisées. Il ne peut ni créer un profil, ni changer `user_id`, ni lire ou modifier celui d’un autre utilisateur. `anon` n’a aucun privilège.

Les préférences suivent des standards extensibles : `country_code` ISO 3166-1 alpha-2, `locale` BCP 47, `timezone` IANA, `currency` ISO 4217 et `primary_language` BCP 47. Le français est la langue initiale, pas une hypothèse de nationalité. Les futures adresses et téléphones devront rester internationaux, avec E.164 pour le téléphone. Les dates, nombres et devises passent par les helpers `Intl` de `src/config/i18n.ts`.

## Variables d’environnement

| Variable | Exposition | Requise | Valeur locale | Rôle |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | client et serveur | oui en production | `http://localhost:3000` | origine canonique et callbacks |
| `NEXT_PUBLIC_SUPABASE_URL` | publique | oui | `http://127.0.0.1:55321` | endpoint Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publique | oui | clé publiable affichée par la CLI | accès soumis à RLS |
| `SUPABASE_SECRET_KEY` | serveur uniquement | non en Phase 3 | non renseignée | opérations privilégiées futures |
| `AI_PROVIDER` | serveur uniquement | oui | `disabled` | empêche tout appel IA réel |

Aucune clé secrète ne doit porter le préfixe `NEXT_PUBLIC_`. La clé publiable ne remplace jamais RLS.

## Email et limitation

Supabase local place les emails dans Mailpit (`http://127.0.0.1:55324`) sans envoi externe. La fréquence minimale entre deux emails est de 60 secondes et les réponses de récupération/renvoi ne révèlent pas si un compte existe. En production, la confirmation doit refléter le réglage réel du projet et un SMTP transactionnel doit être configuré et vérifié ; le SMTP de production n’est pas inclus dans le dépôt.

## Vérification automatisée

```bash
npm run check
npm run build
npm run db:start
npm run db:reset
npm run db:test
git diff --check
```

Les tests Vitest couvrent validation, redirections sûres, session expirée, déconnexion, demandes de récupération non révélatrices, nouveau mot de passe et primitives accessibles. Les tests pgTAP couvrent création du profil, lecture/mise à jour propriétaire et refus inter-utilisateur/anonyme.

## Parcours manuel local

1. Lancer `npm run db:start`, recopier les valeurs publiques locales dans `.env.local`, puis `npm run dev`.
2. Ouvrir `/inscription` et créer `phase3-user@example.test` avec un mot de passe synthétique robuste.
3. Si les confirmations locales sont activées, ouvrir Mailpit, suivre le lien et vérifier que l’URL sensible disparaît après le callback.
4. Vérifier l’arrivée sur `/app`, l’email affiché et le profil associé dans Studio.
5. Se déconnecter, vérifier que `/app` renvoie vers `/connexion`, puis se reconnecter.
6. Depuis `/mot-de-passe-oublie`, demander un lien ; le message doit rester identique pour une adresse inconnue.
7. Ouvrir le message Mailpit, définir un nouveau mot de passe puis vérifier l’accès avec celui-ci.
8. Tester au clavier les champs, liens, focus visible, erreurs annoncées et boutons désactivés pendant l’envoi.

N’utiliser que des identités synthétiques. Aucun email de test n’est envoyé sur Internet.

## Backlog hors Phase 3

- SMTP de production, templates email localisés et suivi de délivrabilité.
- Pages et consentements juridiques après validation.
- OAuth Google/Apple/Microsoft, magic links, SSO et MFA/2FA.
- Gestion des appareils et journal des sessions.
- Catalogues de traduction supplémentaires et sélecteur de locale.
- Durcissement anti-abus additionnel (CAPTCHA/rate limiting applicatif) selon l’exposition réelle.
