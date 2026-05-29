/**
 * NPC — Personagem não-jogável.
 *
 * Sem spritesheet: fica invisível (apenas hitbox de interação).
 * Com spritesheet: renderiza animação idle.
 */
export class NPC {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 24;
        this.name   = config.name   || 'NPC';

        // Sprite (opcional)
        this.spriteSheet = config.spriteSheet || null;
        this.frameW    = config.frameW    || 32;
        this.frameH    = config.frameH    || 32;
        this.facing    = config.facing    || 0;
        this.maxFrames = config.maxFrames || 2;

        // Animação idle
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.4;

        // Diálogos
        this.dialogueLines     = config.dialogueLines || [{ speaker: this.name, text: '...' }];
        this.onInteractComplete = config.onInteractComplete || null;
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer = 0;
        }
    }

    getDialogue() {
        return {
            lines:    this.dialogueLines,
            callback: this.onInteractComplete
        };
    }

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = this.animFrame * this.frameW;
            const sy = this.facing    * this.frameH;
            ctx.drawImage(this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                this.x, this.y, this.width, this.height);
        }
        // Sem spritesheet: não desenha nada (invisível, apenas hitbox)
    }
}