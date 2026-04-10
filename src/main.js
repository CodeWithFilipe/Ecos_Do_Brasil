import BootScene         from './scenes/BootScene.js';
import MenuPrincipal     from './scenes/menu/MenuPrincipal.js';
import BibliotecaScene   from './scenes/fases/biblioteca/BibliotecaScene.js';
import HubScene          from './scenes/fases/hub/HubScene.js';
import VilaRicaScene     from './scenes/fases/vila_rica/VilaRicaScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: '#0a0612',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuPrincipal, BibliotecaScene, HubScene, VilaRicaScene]
};

const game = new Phaser.Game(config);