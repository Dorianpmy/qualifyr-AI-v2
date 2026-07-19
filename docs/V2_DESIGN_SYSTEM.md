# Design System de Qualifyr AI V2

## Source de vérité

Les tokens sont centralisés dans `src/styles/tokens.css`. `src/app/globals.css` les expose à Tailwind et contient uniquement les règles globales, les surfaces partagées et les animations.

## Tokens

- Couleurs : background, surfaces, textes, primaire mauve, statuts, bordures, sidebar, header et overlays.
- Effets : glass, blur, ombres et focus.
- Forme : rayons et espacements.
- Layout : largeurs de sidebar, hauteur de header et largeur maximale du contenu.
- Mouvement : durées et courbes d’accélération.

Une couleur de marque ne doit jamais être ajoutée directement dans un composant. Elle doit recevoir un nom sémantique dans `tokens.css`.

## Thèmes

- Clair : thème prioritaire et rendu principal de V1.
- Sombre : mêmes contrastes et même accent mauve sur des surfaces charbon.
- Système : retire l’attribut `data-theme` et suit `prefers-color-scheme`.

Le sélecteur de thème stocke uniquement `light`, `dark` ou `system` dans `localStorage`. Aucune donnée sensible n’est enregistrée.

## Composants

- `Button` : primary, secondary, outline, ghost, glass, danger, icon, disabled et loading.
- `Card` et surface `qualifyr-glass`.
- `Input`, `Textarea`, `Select` et `Field`.
- `Checkbox`, `Radio` et `Switch`.
- `Badge`, `Alert`, `Tabs`, `DropdownMenu`, `Dialog`.
- `Table`, `EmptyState`, `Skeleton`.
- `PageHeader`, `SectionHeader`, app shell, sidebar et topbar.

## Hover glass

Le hover glass renforce légèrement la bordure, augmente l’opacité de la surface, applique un blur léger, ajoute un reflet transversal et élève la surface d’un pixel. Le contenu conserve sa place et les transitions sont neutralisées avec `prefers-reduced-motion`.

## Responsive

- Desktop : sidebar fixe repliable et topbar sticky.
- Tablette : grilles réduites et contenus fluides.
- Mobile : sidebar remplacée par un dialogue plein écran avec focus géré par Radix ; topbar compacte ; tables scrollables.
- Les contrôles tactiles importants mesurent au moins 40 à 44 px.

## Accessibilité

- HTML sémantique et titres hiérarchisés.
- Focus visible partagé.
- Boutons icône nommés.
- Champs associés à leurs labels.
- Dialogues Radix avec focus piégé et fermeture clavier.
- Alertes complétées par du texte, sans dépendance exclusive à la couleur.
- Animations réduites avec `prefers-reduced-motion`.

## Modifier la direction artistique

Modifier d’abord les tokens sémantiques. Ne changer les composants que si leur structure ou leur comportement doit évoluer. Vérifier ensuite `/design-system` en clair, sombre et système, aux quatre tailles de référence.
