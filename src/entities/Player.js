export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'alex');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        // AJUSTE DE COLISÃO: Foca nos pés para profundidade (estilo Harvest Moon)
        this.body.setSize(22, 12);
        this.body.setOffset(23, 50);

        this.speed = 100;
        this.facing = 'down';

        this.createAnims();
        
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    createAnims() {
        const anims = this.scene.anims;
        if (anims.exists('walk-down')) return;

        // Configuração baseada na spritesheet de 5 colunas
        // Linhas: 0=Down, 1=Up, 2=Left, 3=Right
        const directions = ['down', 'up', 'left', 'right'];
        
        directions.forEach((dir, index) => {
            const startFrame = index * 5;

            // Animação de Caminhada (Frames 1 a 3 da linha)
            anims.create({
                key: `walk-${dir}`,
                frames: anims.generateFrameNumbers('alex', { 
                    start: startFrame, 
                    end: startFrame + 2 
                }),
                frameRate: 10,
                repeat: -1
            });

            // Frame Estático / Idle (Frame 4 da linha)
            anims.create({
                key: `idle-${dir}`,
                frames: [{ key: 'alex', frame: startFrame + 3 }],
                frameRate: 1
            });
        });
    }

    update() {
        this.body.setVelocity(0);
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -this.speed; this.facing = 'left'; }
        else if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = this.speed; this.facing = 'right'; }
        
        if (this.cursors.up.isDown || this.wasd.up.isDown) { vy = -this.speed; this.facing = 'up'; }
        else if (this.cursors.down.isDown || this.wasd.down.isDown) { vy = this.speed; this.facing = 'down'; }

        // Suavização diagonal
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        this.body.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.play(`walk-${this.facing}`, true);
        } else {
            this.play(`idle-${this.facing}`, true);
        }
    }
}