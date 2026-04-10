// src/core/InputHandler.js
//
// Centraliza leitura de teclado (WASD + Setas).
// Expõe:
//   • Booleans de direção (up / down / left / right)
//   • Vetor normalizado via getMovementVector()
//   • Eventos de borda de subida (justAction, justDiary, justVision, justPause)
//   • Helper direction (string) para troca de textura
//
// Uso em qualquer Scene ou Entity:
//   import InputHandler from '../core/InputHandler.js';
//
//   create() {
//       this.input = new InputHandler(this);
//   }
//   update() {
//       const { x, y } = this.input.getMovementVector();
//       player.body.setVelocity(x * SPEED, y * SPEED);
//       if (this.input.justAction) { ... }
//   }
// ─────────────────────────────────────────────────────────────

export default class InputHandler {

    constructor(scene) {
        this.scene = scene;
        const kb  = scene.input.keyboard;
        const Key = Phaser.Input.Keyboard.KeyCodes;

        this._k = kb.addKeys({
            up:       Key.W,
            down:     Key.S,
            left:     Key.A,
            right:    Key.D,
            upArr:    Key.UP,
            downArr:  Key.DOWN,
            leftArr:  Key.LEFT,
            rightArr: Key.RIGHT,
            action:    Key.SPACE,
            actionAlt: Key.E,
            diary:     Key.TAB,
            vision:    Key.V,
            pause:     Key.ESC,
        });
    }

    // ── Estado contínuo (segurar tecla) ───────────────────────
    get up()    { return this._k.up.isDown    || this._k.upArr.isDown;    }
    get down()  { return this._k.down.isDown  || this._k.downArr.isDown;  }
    get left()  { return this._k.left.isDown  || this._k.leftArr.isDown;  }
    get right() { return this._k.right.isDown || this._k.rightArr.isDown; }

    /** Verdadeiro enquanto qualquer direção estiver pressionada */
    get moving() { return this.up || this.down || this.left || this.right; }

    // ── Vetor de movimento normalizado ────────────────────────
    /**
     * Retorna { x, y } com magnitude ≤ 1.
     * Diagonal → magnitude exatamente 1 (normalizado).
     * Em repouso → { x: 0, y: 0 }.
     *
     * Exemplo de uso no Player (ou na Scene):
     *   const v = this.input.getMovementVector();
     *   this.body.setVelocity(v.x * this.speed, v.y * this.speed);
     */
    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.left)  x -= 1;
        if (this.right) x += 1;
        if (this.up)    y -= 1;
        if (this.down)  y += 1;

        // Normaliza diagonal
        if (x !== 0 && y !== 0) {
            const inv = 1 / Math.sqrt(2); // ≈ 0.7071
            x *= inv;
            y *= inv;
        }

        return { x, y };
    }

    // ── Borda de subida (JustDown — dispara apenas uma vez) ───
    get justAction() {
        return Phaser.Input.Keyboard.JustDown(this._k.action) ||
               Phaser.Input.Keyboard.JustDown(this._k.actionAlt);
    }

    get justDiary()  { return Phaser.Input.Keyboard.JustDown(this._k.diary);  }
    get justVision() { return Phaser.Input.Keyboard.JustDown(this._k.vision); }
    get justPause()  { return Phaser.Input.Keyboard.JustDown(this._k.pause);  }

    // ── Helper de direção (string) ────────────────────────────
    /**
     * Retorna 'left' | 'right' | 'up' | 'down' | null.
     * Prioridade: horizontal > vertical.
     * Útil para setTexture(`idle_${input.direction}`).
     */
    get direction() {
        if (this.left)  return 'left';
        if (this.right) return 'right';
        if (this.up)    return 'up';
        if (this.down)  return 'down';
        return null;
    }
}