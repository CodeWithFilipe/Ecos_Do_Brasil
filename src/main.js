import BootScene from './scenes/BootScene.js';
import BibliotecaScene from './scenes/fases/biblioteca/BibliotecaScene.js';

const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 200,
    zoom: 3,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [ BootScene, BibliotecaScene ]
};

const game = new Phaser.Game(config);