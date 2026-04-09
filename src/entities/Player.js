import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.speed = 120;
        this.facing = 'down';
        this.isGuardian = false;

        this.createAnims();
    }

    createAnims() {
        const anims = this.scene.anims;
        // Mapeamento: Linha 0: Down, 1: Left, 2: Right, 3: Up
        const dirs = ['down', 'left', 'right', 'up'];
        dirs.forEach((dir, i) => {
            anims.create({
                key: `walk-${dir}`,
                frames: anims.generateFrameNumbers('player', { start: i * 5, end: i * 5 + 2 }),
                frameRate: 8,
                repeat: -1
            });
            anims.create({
                key: `idle-${dir}`,
                frames: [{ key: 'player', frame: i * 5 + 3 }],
                frameRate: 1
            });
        });
    }

    update(cursors, wasd) {
        this.body.setVelocity(0);
        let vx = 0, vy = 0;

        if (cursors.left.isDown || wasd.left.isDown) { vx = -this.speed; this.facing = 'left'; }
        else if (cursors.right.isDown || wasd.right.isDown) { vx = this.speed; this.facing = 'right'; }
        
        if (cursors.up.isDown || wasd.up.isDown) { vy = -this.speed; this.facing = 'up'; }
        else if (cursors.down.isDown || wasd.down.isDown) { vy = this.speed; this.facing = 'down'; }

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        this.body.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.play(`walk-${this.facing}`, true);
        } else {
            this.play(`idle-${this.facing}`, true);
        }
    }

    toggleGuardian(active) {
        this.isGuardian = active;
        active ? this.setTint(0x9966ff) : this.clearTint();
    }
}