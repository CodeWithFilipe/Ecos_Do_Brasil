import Player from '../../entities/Player.js'; // Ajuste o caminho se necessário

export default class BibliotecaScene extends Phaser.Scene {
    constructor() { super('Biblioteca'); }

    create() {
        const { width, height } = this.scale;

        // 1. Pintando o chão e a parede de fundo usando TileSprite (Repetição)
        this.add.tileSprite(0, 0, width * 2, height * 2, 'piso_madeira_pro').setOrigin(0, 0).setDepth(0);
        this.add.tileSprite(0, 0, width * 2, 64, 'parede_pro').setOrigin(0, 0).setDepth(1);

        // 2. Grupo de obstáculos (Móveis sólidos onde o player bate)
        this.obstaculos = this.physics.add.staticGroup();

        // Construindo a Biblioteca via Coordenadas (x, y)
        // Linha de estantes no fundo da sala
        this.obstaculos.create(100, 70, 'estante_pro').setSize(96, 40).setOffset(0, 56).setDepth(2);
        this.obstaculos.create(250, 70, 'estante_pro').setSize(96, 40).setOffset(0, 56).setDepth(2);
        this.obstaculos.create(400, 70, 'estante_pro').setSize(96, 40).setOffset(0, 56).setDepth(2);

        // Mesas de estudo no centro
        this.obstaculos.create(200, 300, 'mesa_pro').setSize(64, 20).setOffset(0, 16).setDepth(2);
        this.obstaculos.create(450, 300, 'mesa_pro').setSize(64, 20).setOffset(0, 16).setDepth(2);

        // 3. Adicionando o Player (Alex)
        this.player = new Player(this, width / 2, height - 100);
        this.player.setDepth(3); // Fica por cima do chão, interage com a profundidade dos móveis

        // 4. NPC Professora (Opcional, com física se quiser falar com ela)
        this.professora = this.physics.add.staticSprite(600, 150, 'prof_down');
        this.professora.setDepth(2);

        // 5. Ativando as colisões
        this.physics.add.collider(this.player, this.obstaculos);
        this.physics.add.collider(this.player, this.professora);

        // 6. Configuração da Câmera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.physics.world.setBounds(0, 0, width, height);
    }

    update() {
        this.player.update();
    }
}