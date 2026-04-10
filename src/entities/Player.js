// src/entities/Player.js
//
// Usa setTexture() para troca de visual conforme direção.
// Requer que o BootScene carregue texturas estáticas:
//   'idle_down', 'idle_up', 'idle_left', 'idle_right'
//   'walk_down', 'walk_up', 'walk_left', 'walk_right'
//
// (Se o spritesheet 'alex' ainda for usado, basta ajustar
//  os nomes de chave nas chamadas setTexture() abaixo.)
// ─────────────────────────────────────────────────────────────

import InputHandler from '../core/InputHandler.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        // Inicia com a textura idle voltada para baixo
        super(scene, x, y, 'idle_down');

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

        // Z-Index: garante que o Alex fique na frente do chão e móveis
        this.setDepth(10);

        // Escala: reduz o sprite de ~68 px para encaixar no zoom da câmera
        this.setScale(0.45);

        // Hitbox nos pés: cabeça pode "passar por trás" de objetos altos
        // Os offsets assumem sprite original de 48 × 68 px — ajuste se necessário
        this.body.setSize(24, 16);
        this.body.setOffset(12, 52);

        this.speed  = 120;
        this.facing = 'down';

        // InputHandler centralizado — sem duplicar addKeys() aqui
        this.input = new InputHandler(scene);

        // Diário / visão do guardião são disparados pelas cenas, não pelo Player,
        // mas o handler já expõe justDiary / justVision se precisar usar aqui.
    }

    // ─── Loop principal ───────────────────────────────────────
    update() {
        const { input } = this;

        // 1. Calcula vetor de movimento
        let vx = 0;
        let vy = 0;

        if (input.left)  { vx = -this.speed; }
        if (input.right) { vx =  this.speed;  }
        if (input.up)    { vy = -this.speed;  }
        if (input.down)  { vy =  this.speed;  }

        // 2. Normaliza diagonal (mantém magnitude constante)
        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;   // 1 / √2
            vy *= 0.7071;
        }

        this.body.setVelocity(vx, vy);

        // 3. Atualiza direção do sprite (apenas quando há movimento)
        const moving = (vx !== 0 || vy !== 0);

        if (moving) {
            // Prioridade: horizontal > vertical (ajuste se preferir vertical)
            if      (vx < 0) this.facing = 'left';
            else if (vx > 0) this.facing = 'right';
            else if (vy < 0) this.facing = 'up';
            else              this.facing = 'down';
        }

        // 4. Troca de textura — SEM play(); usa texturas estáticas
        const prefix = moving ? 'walk' : 'idle';
        this.setTexture(`${prefix}_${this.facing}`);
    }

    // ─── Visão do Guardião (chamada por BibliotecaScene) ─────
    toggleGuardianVision(active) {
        this.guardianVisionActive = active;
        active ? this.setTint(0x7F77DD) : this.clearTint();
    }
}