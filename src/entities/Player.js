export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'alex');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(12, 10);
        this.body.setOffset(2, 14);

        this.speed = 90;
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

        const dirs = ['down', 'left', 'right', 'up'];
        dirs.forEach((dir, i) => {
            anims.create({
                key: `walk-${dir}`,
                frames: anims.generateFrameNumbers('alex', { start: i * 5, end: i * 5 + 2 }),
                frameRate: 8,
                repeat: -1
            });
            anims.create({
                key: `idle-${dir}`,
                frames: [{ key: 'alex', frame: i * 5 + 3 }],
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

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        this.body.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.play(`walk-${this.facing}`, true);
        } else {
            this.play(`idle-${this.facing}`, true);
        }
    }

    toggleGuardianVision(active) {
        active ? this.setTint(0x7F77DD) : this.clearTint();
    }
}