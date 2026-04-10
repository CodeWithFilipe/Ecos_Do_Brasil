// ─────────────────────────────────────────────────────────────
// main.js  —  Entry point do Ecos do Brasil
//
// Estrutura de pastas:
//   src/
//     main.js                              ← este arquivo
//     scenes/
//       BootScene.js
//       fases/
//         biblioteca/  BibliotecaScene.js
//         hub/         HubScene.js
//         vilarica/    VilaRicaScene.js
//     entities/
//       Player.js
//     systems/
//       DialogueManager.js
//       Diario.js
//       InputHandler.js
// ─────────────────────────────────────────────────────────────

import BootScene       from './scenes/BootScene.js';
import BibliotecaScene from './scenes/fases/biblioteca/BibliotecaScene.js';
import HubScene        from './scenes/fases/hub/HubScene.js';
import VilaRicaScene   from './scenes/fases/vilarica/VilaRicaScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',

    // Resolução lógica 320×200 @ zoom 3 → janela final 960×600
    // Toda posição no código usa o espaço 320×200.
    // Phaser escala o canvas automaticamente pelo zoom.
    width:  320,
    height: 200,
    zoom:   3,

    pixelArt: true,
    antialias: false,
    render: { pixelArt: true, antialias: false },

    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },

    // Boot sempre primeiro — carrega todos os assets antes das cenas
    scene: [BootScene, BibliotecaScene, HubScene, VilaRicaScene]
};

new Phaser.Game(config);