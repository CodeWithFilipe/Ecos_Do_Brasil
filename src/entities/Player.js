export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'alex');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        // Hitbox nos pés: permite que a cabeça do Alex passe 'por trás' de estantes
        this.body.setSize(24, 16);
        this.body.setOffset(22, 52);

        this.speed = 120;
        this.facing = 'down';

        this.createAnims();
        
        this.wasd = scene.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    createAnims() {
        const anims = this.scene.anims;
        if (anims.exists('walk-down')) return;

        const dirs = ['down', 'up', 'left', 'right'];

        dirs.forEach((dir, rowIndex) => {
            const base = rowIndex * 5;

            // Animação de caminhada: usa estritamente as colunas do meio (2, 3 e 4)
            anims.create({
                key: `walk-${dir}`,
                frames: anims.generateFrameNumbers('alex', { 
                    frames: [base + 1, base + 2, base + 3] 
                }),
                frameRate: 8,
                repeat: -1
            });

            // Parado (Idle): usa estritamente a primeira coluna
            anims.create({
                key: `idle-${dir}`,
                frames: [{ key: 'alex', frame: base }],
                frameRate: 1
            });
        });
    }

    update() {
        this.body.setVelocity(0);
        let vx = 0, vy = 0;

        if (this.wasd.A.isDown) { vx = -this.speed; this.facing = 'left'; }
        else if (this.wasd.D.isDown) { vx = this.speed; this.facing = 'right'; }
        
        if (this.wasd.W.isDown) { vy = -this.speed; this.facing = 'up'; }
        else if (this.wasd.S.isDown) { vy = this.speed; this.facing = 'down'; }

        if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

        this.body.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.play(`walk-${this.facing}`, true);
        } else {
            this.play(`idle-${this.facing}`, true);
        }
    }
}