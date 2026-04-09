const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    pixelArt: true, // ESSENCIAL para o estilo Harvest Moon
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
    },
    scene: [BootScene, BibliotecaScene]
};