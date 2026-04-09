export default class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        // CARREGAMENTO DOS SEUS ASSETS REAIS
        this.load.spritesheet('player', 'assets/sprites/player/spritecompleta.png', { frameWidth: 16, frameHeight: 24 });
        this.load.image('clio', 'assets/sprites/clio/clio_spritesheet.png'); // Ajuste se for spritesheet
        
        // Carrega os tilesets que você tem
        this.load.image('floor', 'assets/tilesets/floor.png'); 
    }
    create() {
        this.scene.start('Menu');
    }
}