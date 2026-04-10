// ─────────────────────────────────────────────────────────────
// systems/InputHandler.js
//
// Centraliza leitura de teclado. Expõe estado simples (booleans)
// para as cenas consultarem no update, sem duplicar addKeys().
//
// Uso em qualquer Scene:
//   import InputHandler from '../../systems/InputHandler.js'; (ajuste path)
//
//   create() {
//       this.input = new InputHandler(this);
//   }
//   update() {
//       if (this.input.left)   { ... }
//       if (this.input.justAction) { ... }  // ESPAÇO ou E — borda de subida
//       if (this.input.justDiary)  { ... }  // TAB
//       if (this.input.justVision) { ... }  // V
//   }
// ─────────────────────────────────────────────────────────────

export default class InputHandler {
    constructor(scene) {
        this.scene = scene;
        const kb   = scene.input.keyboard;
        const Key  = Phaser.Input.Keyboard.KeyCodes;

        this._k = kb.addKeys({
            up:     Key.W,
            down:   Key.S,
            left:   Key.A,
            right:  Key.D,
            upArr:  Key.UP,
            downArr:Key.DOWN,
            leftArr:Key.LEFT,
            rightArr:Key.RIGHT,
            action: Key.SPACE,
            actionAlt: Key.E,
            diary:  Key.TAB,
            vision: Key.V,
            pause:  Key.ESC,
        });
    }

    // ── Estado contínuo (segurar tecla) ───────────────────────
    get up()    { return this._k.up.isDown    || this._k.upArr.isDown;    }
    get down()  { return this._k.down.isDown  || this._k.downArr.isDown;  }
    get left()  { return this._k.left.isDown  || this._k.leftArr.isDown;  }
    get right() { return this._k.right.isDown || this._k.rightArr.isDown; }

    /** Verdadeiro enquanto qualquer direção estiver pressionada */
    get moving() { return this.up || this.down || this.left || this.right; }

    // ── Borda de subida (JustDown — só dispara uma vez por pressão) ──
    get justAction() {
        return Phaser.Input.Keyboard.JustDown(this._k.action) ||
               Phaser.Input.Keyboard.JustDown(this._k.actionAlt);
    }

    get justDiary()  { return Phaser.Input.Keyboard.JustDown(this._k.diary);  }
    get justVision() { return Phaser.Input.Keyboard.JustDown(this._k.vision); }
    get justPause()  { return Phaser.Input.Keyboard.JustDown(this._k.pause);  }

    /** Direção como string, útil para animações */
    get direction() {
        if (this.left)  return 'left';
        if (this.right) return 'right';
        if (this.up)    return 'up';
        if (this.down)  return 'down';
        return null;
    }
}