import Player from '../../../entities/Player.js';

export default class BibliotecaScene extends Phaser.Scene {
    constructor() {
        super('Biblioteca');
    }

    create() {
        // 1. Cria o Chão (para o fundo não ficar preto e podermos ver o Alex a mover-se)
        this.physics.world.setBounds(0, 0, 640, 400); // Define o tamanho do mapa
        this.add.tileSprite(0, 0, 640, 400, 'piso_madeira').setOrigin(0, 0).setDepth(-1);

        // 2. Cria o Alex (Player)
        this.player = new Player(this, 320, 200);

        // 3. Cria a Guardiã Clio (NPC)
        this.clioGuardia = this.physics.add.sprite(380, 200, 'clio_guardia');
        this.clioGuardia.setImmovable(true);

        // 4. Adiciona colisão entre Alex e a Guardiã
        this.physics.add.collider(this.player, this.clioGuardia);

        // 5. Configura a Câmera para seguir o Alex
        this.cameras.main.setBounds(0, 0, 640, 400);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 6. UI Text (colados na tela com setScrollFactor(0))
        this.add.text(10, 10, '📚 Biblioteca da Escola', { fontSize: '8px', fontFamily: 'monospace', color: '#EF9F27' }).setScrollFactor(0);
        this.add.text(10, 25, 'Use WASD ou Setas para mover', { fontSize: '6px', fontFamily: 'monospace', color: '#7F77DD' }).setScrollFactor(0);

        this.vKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.isGuardian = false;
    }

    update() {
        // Atualiza a lógica de movimento do Alex
        this.player.update();

        // Ativa a Visão do Guardião
        if (Phaser.Input.Keyboard.JustDown(this.vKey)) {
            this.isGuardian = !this.isGuardian;
            this.player.toggleGuardianVision(this.isGuardian);
        }

        // Interação com NPCs (Clio a Guardiã)
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.clioGuardia.x, this.clioGuardia.y);
            if (dist < 30) {
                console.log("Diário de Alex: A Guardiã Clio está parada aqui.");
                // Aqui chamaremos o DialogueManager no próximo passo
            }
        }
    }
}