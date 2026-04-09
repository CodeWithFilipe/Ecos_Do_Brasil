export default class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    preload() {
        // CORREÇÃO: Alex ajustado para 68x68 (Alta Qualidade)
        this.load.spritesheet('alex', 'assets/sprites/player/spritesheet.png', { 
            frameWidth: 68, 
            frameHeight: 68 
        });

        // PROFESSORA: Carregando as direções enviadas
        this.load.image('prof_down', 'assets/sprites/professora/south.png');
        this.load.image('prof_up', 'assets/sprites/professora/north.png');
        this.load.image('prof_left', 'assets/sprites/professora/west.png');
        this.load.image('prof_right', 'assets/sprites/professora/east.png');

        // Assets de cenário
        this.load.image('piso_madeira', 'assets/textures/piso_madeira.png'); // Se tiver o PNG
    }

    create() {
        // Caso não tenha o PNG do piso, gera a textura procedural
        if (!this.textures.exists('piso_madeira')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x3a200a, 1); g.fillRect(0, 0, 16, 16);
            g.fillStyle(0x4a2e14, 1); g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
            g.generateTexture('piso_madeira', 16, 16);
            g.destroy();
        }

        this.scene.start('Biblioteca');
    }
}