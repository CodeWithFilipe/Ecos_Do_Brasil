/**
 * Player.js — Ecos do Brasil: Guardião da Memória
 * 
 * CORREÇÕES aplicadas sobre o código gerado pelo Qwen Coder 2.5:
 *  1. Phaser.Animation.generateFrameNumbers → scene.anims.generateFrameNumbers
 *  2. Frame único: sintaxe { key, frame: N } em vez de { frame: { frame: N } }
 *  3. Idle direction: salva `this.facing` ANTES de zerar velocidade
 *  4. preload() removido da classe — pertence à BootScene/cena pai
 *  5. Integração com DiarySystem e GuardianVision da nossa arquitetura
 */

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} [config]
   * @param {import('../ui/DiarySystem.js').DiarySystem} [config.diaryRef]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 200;

    // Hitbox menor que o sprite (pés do personagem)
    this.body.setSize(12, 10);
    this.body.setOffset(2, 14);
    this.setCollideWorldBounds(true);

    // Estado interno
    this.facing         = 'down';
    this.isInteracting  = false;
    this.guardianMode   = false;

    this.diary = config.diaryRef ?? null;

    this._createAnimations(scene);

    // Input
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._wasd    = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this._spaceKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._visionKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    this._spaceKey.on('down',  this._onInteract,          this);
    this._visionKey.on('down', this._toggleGuardianVision, this);

    this.nearbyTarget = null;
    this._visionTween = null;
  }

  // =========================================================================
  // LOOP
  // =========================================================================

  update(_time, _delta) {
    if (this.isInteracting) {
      this.setVelocity(0, 0);
      return;
    }
    this._handleMovement();
    this._checkProximity();
  }

  // =========================================================================
  // MOVIMENTO
  // =========================================================================

  _handleMovement() {
    const { _cursors: cur, _wasd: wasd } = this;

    let vx = 0;
    let vy = 0;

    if (cur.left.isDown  || wasd.left.isDown)  { vx = -this.speed; this.facing = 'left';  }
    if (cur.right.isDown || wasd.right.isDown) { vx =  this.speed; this.facing = 'right'; }
    if (cur.up.isDown    || wasd.up.isDown)    { vy = -this.speed; this.facing = 'up';    }
    if (cur.down.isDown  || wasd.down.isDown)  { vy =  this.speed; this.facing = 'down';  }

    // Normaliza diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.setVelocity(vx, vy);

    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      this.anims.play(`walk-${this.facing}`, true);
    } else {
      // BUG CORRIGIDO: this.facing gravado ANTES do setVelocity(0,0)
      this.anims.play(`idle-${this.facing}`, true);
    }
  }

  // =========================================================================
  // PROXIMIDADE / INTERAÇÃO
  // =========================================================================

  _checkProximity() {
    if (!this.scene.interactables) return;

    const RANGE = 32;
    let closest     = null;
    let closestDist = Infinity;

    this.scene.interactables.getChildren().forEach(obj => {
      const d = Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y);
      if (d < RANGE && d < closestDist) {
        closestDist = d;
        closest     = obj;
      }
    });

    if (this.nearbyTarget && this.nearbyTarget !== closest) {
      this.nearbyTarget.emit('player_leave');
    }
    if (closest && closest !== this.nearbyTarget) {
      closest.emit('player_near');
    }

    this.nearbyTarget = closest;
  }

  _onInteract() {
    if (this.isInteracting) return;
    this.nearbyTarget?.emit('interact', this);
  }

  // =========================================================================
  // VISÃO DO GUARDIÃO
  // =========================================================================

  _toggleGuardianVision() {
    this.guardianMode = !this.guardianMode;

    if (this.guardianMode) {
      // BUG CORRIGIDO: Phaser.Display.Color.HexToUint32 retorna ARGB —
      // o setTint() do Phaser espera RGB puro. Use o literal hex diretamente.
      this.setTint(0x9966ff);

      this._visionTween = this.scene.tweens.add({
        targets:  this,
        alpha:    0.75,
        duration: 400,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut',
      });
    } else {
      this._visionTween?.stop();
      this._visionTween = null;
      this.clearTint();
      this.setAlpha(1);
    }

    this.scene.events.emit('guardian_vision_changed', this.guardianMode);
  }

  // =========================================================================
  // DIÁRIO
  // =========================================================================

  /**
   * Compatível com o padrão do Qwen (events) E com o DiarySystem.
   */
  addNote(text, key = null, category = 'reflexao') {
    this.scene.events.emit('noteAdded', text);

    if (this.diary) {
      this.diary.addEntry(key ?? `note_${Date.now()}`, text, category);
    }
  }

  // =========================================================================
  // LOCK / UNLOCK
  // =========================================================================

  lockMovement()   { this.isInteracting = true;  this.setVelocity(0, 0); }
  unlockMovement() { this.isInteracting = false; }

  // =========================================================================
  // ANIMAÇÕES
  // =========================================================================

  _createAnimations(scene) {
    if (scene.anims.exists('idle-down')) return;

    const { anims } = scene;

    // BUG CORRIGIDO: sintaxe correta para frame único
    const idleFrame = (n) => [{ key: 'player', frame: n }];

    anims.create({ key: 'idle-up',    frames: idleFrame(0), frameRate: 10, repeat: -1 });
    anims.create({ key: 'idle-down',  frames: idleFrame(3), frameRate: 10, repeat: -1 });
    anims.create({ key: 'idle-left',  frames: idleFrame(6), frameRate: 10, repeat: -1 });
    anims.create({ key: 'idle-right', frames: idleFrame(9), frameRate: 10, repeat: -1 });

    // BUG CORRIGIDO: scene.anims.generateFrameNumbers (não Phaser.Animation.*)
    const walk = (s, e) => anims.generateFrameNumbers('player', { start: s, end: e });

    anims.create({ key: 'walk-up',    frames: walk(1,  2),  frameRate: 10, repeat: -1 });
    anims.create({ key: 'walk-down',  frames: walk(4,  5),  frameRate: 10, repeat: -1 });
    anims.create({ key: 'walk-left',  frames: walk(7,  8),  frameRate: 10, repeat: -1 });
    anims.create({ key: 'walk-right', frames: walk(10, 11), frameRate: 10, repeat: -1 });
  }

  // =========================================================================
  // DESTROY
  // =========================================================================

  destroy(fromScene) {
    this._spaceKey?.off('down',  this._onInteract,          this);
    this._visionKey?.off('down', this._toggleGuardianVision, this);
    this._visionTween?.stop();
    super.destroy(fromScene);
  }
}