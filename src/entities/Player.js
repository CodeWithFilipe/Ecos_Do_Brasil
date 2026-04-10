// ─────────────────────────────────────────────────────────────
// entities/Player.js
//
// Spritesheet: 68×68px por frame, 5 colunas × 4 linhas
//   Linha 0 = Down  | Linha 1 = Up
//   Linha 2 = Left  | Linha 3 = Right
//   Frames por linha: 0,1,2 = walk | 3 = idle | 4 = extra
//
// No mundo 320×200 o sprite é exibido em 16×16 lógicos
// (o zoom ×3 do Phaser escala para 48×48 na tela).
// ─────────────────────────────────────────────────────────────

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'alex');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // No espaço lógico 320×200, o sprite renderiza em ~16px
        // setDisplaySize garante tamanho consistente independente do frameWidth original
        this.setDisplaySize(16, 16);

        this.setCollideWorldBounds(true);

        // Hitbox nos pés (estilo Harvest Moon / top-down RPG)
        // 10px largura, 6px altura, centralizado na base do sprite
        this.body.setSize(10, 6);
        this.body.setOffset(3, 10);

        this.speed  = 80;  // pixels lógicos por segundo
        this.facing = 'down';

        // Estado: Visão do Guardião
        this.guardianVisionActive = false;
        this._visionOverlay = null;

        this._buildAnims();

        // Input direto (cenas também podem usar InputHandler)
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });
    }

    // ── Animações ──────────────────────────────────────────────
    _buildAnims() {
        const anims = this.scene.anims;
        if (anims.exists('walk-down')) return; // já criadas

        const dirs = ['down', 'up', 'left', 'right'];
        dirs.forEach((dir, row) => {
            const base = row * 5;

            anims.create({
                key: `walk-${dir}`,
                frames: anims.generateFrameNumbers('alex', { start: base, end: base + 2 }),
                frameRate: 10,
                repeat: -1
            });

            anims.create({
                key: `idle-${dir}`,
                frames: [{ key: 'alex', frame: base + 3 }],
                frameRate: 1,
                repeat: 0
            });
        });
    }

    // ── Update (chamado pela cena) ─────────────────────────────
    update() {
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  { vx = -this.speed; this.facing = 'left';  }
        else if (this.cursors.right.isDown || this.wasd.right.isDown) { vx =  this.speed; this.facing = 'right'; }

        if (this.cursors.up.isDown    || this.wasd.up.isDown)    { vy = -this.speed; this.facing = 'up';    }
        else if (this.cursors.down.isDown  || this.wasd.down.isDown)  { vy =  this.speed; this.facing = 'down';  }

        // Diagonal normalizada
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        this.body.setVelocity(vx, vy);

        if (vx !== 0 || vy !== 0) {
            this.play(`walk-${this.facing}`, true);
        } else {
            this.play(`idle-${this.facing}`, true);
        }

        // Mantém overlay da Visão do Guardião colado no player
        if (this._visionOverlay) {
            this._visionOverlay.setPosition(this.x, this.y);
        }
    }

    // ── Visão do Guardião ──────────────────────────────────────
    /**
     * Ativa/desativa o efeito visual da Visão do Guardião.
     * Quando ativa, itens e distorções ocultos ficam visíveis na cena.
     * @param {boolean} active
     */
    toggleGuardianVision(active) {
        this.guardianVisionActive = active;

        if (active) {
            // Aura roxa ao redor do player
            if (!this._visionOverlay) {
                const g = this.scene.add.graphics().setDepth(this.depth + 1);
                g.lineStyle(1, 0x7F77DD, 0.8);
                g.strokeCircle(0, 0, 14);
                g.fillStyle(0x3C3489, 0.2);
                g.fillCircle(0, 0, 14);
                this._visionOverlay = g;
                this._visionOverlay.setPosition(this.x, this.y);

                // Pulsa
                this.scene.tweens.add({
                    targets: this._visionOverlay,
                    alpha: 0.3,
                    duration: 700,
                    yoyo: true,
                    repeat: -1
                });
            }
            // Notifica a cena para revelar objetos ocultos pela névoa
            this.scene.events.emit('guardianVisionOn');
        } else {
            if (this._visionOverlay) {
                this._visionOverlay.destroy();
                this._visionOverlay = null;
            }
            this.scene.events.emit('guardianVisionOff');
        }
    }

    // ── Helpers ────────────────────────────────────────────────
    /** Para o player (usado durante diálogos) */
    freeze()   { this.body.setVelocity(0); this.play(`idle-${this.facing}`, true); }

    /** Retoma o controle */
    unfreeze() { /* apenas para na próxima velocidade do update */ }
}