# Fondation internationale

## Standards

- pays : ISO 3166-1 alpha-2 ;
- devise : ISO 4217 ;
- locale et langue : BCP 47 ;
- fuseau horaire : identifiant IANA ;
- téléphone futur : E.164 ;
- affichage : APIs `Intl.DateTimeFormat` et `Intl.NumberFormat`.

Le français (`fr-FR`) reste la langue initiale de l’interface, sans supposer une nationalité, une devise ou un fuseau. Les libellés sont centralisés hors des composants.

## Marchés configurés

La configuration extensible `src/config/i18n.ts` propose France, Belgique, Luxembourg, Suisse, Pologne et Roumanie. Elle contient locale, fuseau, devise et langue principale proposés pour chaque marché. L’utilisateur peut corriger toutes les propositions avant création.

Les codes CZ, SK, HU, BG, HR, SI, EE, LV et LT sont identifiés comme extensions futures. Ajouter un marché proposé nécessite une entrée de configuration et ses tests, pas une migration de schéma. Le stockage accepte tout code au format standard et n’impose pas une relation pays/devise irréversible.

## Tests

Les formats `fr-FR`, `fr-BE`, `fr-CH`, `pl-PL` et `ro-RO` sont couverts. Les tests PostgreSQL créent des organisations françaises, polonaises et roumaines et vérifient leur isolation.

Aucune logique fiscale, juridique locale ou traduction complète n’est incluse.
