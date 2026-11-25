# Dés 3D du Yam's Club

Moteur et modèles repris et adaptés pour le Yam's Club.

| Élément | Origine | Licence |
|---|---|---|
| Moteur `dice-box` 1.1.4 (`*.min.js`, `assets/ammo`) | https://github.com/3d-dice/dice-box — © 2021 3Ddice | MIT (`LICENSE-dice-box.txt`) |
| Thème `smooth` (dé arrondi) | https://github.com/3d-dice/dice-themes — © 2022 3D Dice | MIT (`assets/themes/LICENSE-dice-themes.txt`) |
| Sons `sounds/` (dés sur feutrine, petits chocs de dés) | https://github.com/3d-dice/dice-box-threejs (`public/sounds`) — © 2022 3D Dice | MIT (`sounds/LICENSE-dice-box-threejs.txt`) |
| Thème `yams` (dé à points) | adapté du thème « Smooth Pips » (Frank Ali), points recolorés en rouge | MIT |

Pour retravailler les dés : les fichiers Blender sources sont dans le dépôt `3d-dice/dice-themes` (`3d_files/default`).
Le thème du Yam's Club se règle dans `assets/themes/yams/theme.config.json` (texture des points `pips-red.png`, relief `pips-normal.png`).

Modification Yam's Club (nov. 2026) : le worker physique intégré (base64) accepte insetPx et wallH pour ajouter des murs bas sur le bord intérieur de la piste — les dés partent du rebord et passent par-dessus.

Modification Yam's Club (25 nov. 2026) : l'accueil utilise le rendu sur la page (`offscreen:false`) ; `world.onscreen.min.js` expose `globalThis.__yamsWorld.yamsPeek()` (scène, dés, canvas) pour toucher un dé précis, dessiner les néons (dé gardé en bleu, dé cassé en rouge) et repérer un dé penché ou posé sur un autre.
