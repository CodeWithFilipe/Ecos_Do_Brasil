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
//     menu/
//       MenuPrincipal.js
//       Historia.js
//       Configuracoes.js
//       Creditos.js
//     audio/
//       SoundManager.js
// ─────────────────────────────────────────────────────────────

import BootScene       from './scenes/BootScene.js';
import BibliotecaScene from './scenes/fases/biblioteca/BibliotecaScene.js';
import HubScene        from './scenes/fases/hub/HubScene.js';
import VilaRicaScene   from './scenes/fases/vila_rica/VilaRicaScene.js';
import MenuPrincipal   from './scenes/menu/MenuPrincipal.js';
import Historia        from './scenes/menu/Historia.js';
import Configuracoes   from './scenes/menu/Configuracoes.js';
import Creditos        from './scenes/menu/Creditos.js';

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
    // MenuPrincipal é a cena inicial do jogo
    scene: [BootScene, MenuPrincipal, Historia, Configuracoes, Creditos, BibliotecaScene, HubScene, VilaRicaScene]
};

new Phaser.Game(config);