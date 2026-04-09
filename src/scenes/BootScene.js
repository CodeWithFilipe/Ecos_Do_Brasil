export default class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // --- CARREGAMENTO DO ALEX (PLAYER) ---
        // Certifique-se de que o arquivo está em: assets/sprites/player/spritesheet.png
        // E que os frames têm 16x24 pixels (ajuste se for diferente!)
        this.load.spritesheet('alex', 'assets/sprites/player/spritesheet.png', { 
            frameWidth: 16, 
            frameHeight: 24 
        });

        // --- CARREGAMENTO DA GUARDIA CLIO ---
        // Certifique-se de que você tem uma imagem para a Guardiã na pasta assets/sprites/guardia/
        // Vamos usar um placeholder por agora para o jogo não dar erro.
        this.load.spritesheet('clio_guardia', 'assets/sprites/guardia/guardia_spritesheet.png', { 
            frameWidth: 16, 
            frameHeight: 32 // Ajuste conforme a sua arte real
        });
    }

    create() {
        // Cria uma textura de chão simples via código para o fundo não ficar preto
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x3a200a, 1); // Castanho escuro para madeira
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x4a2e14, 1); // Castanho mais claro para bordas
        g.fillRect(0, 0, 16, 1);
        g.fillRect(0, 0, 1, 16);
        g.generateTexture('piso_madeira', 16, 16);
        g.destroy();

        // Quando tudo carregar, vai para a Biblioteca
        this.scene.start('Biblioteca');
    }
}