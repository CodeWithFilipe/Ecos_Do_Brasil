/**
 * NPC — Personagem não-jogável.
 *
 * Suporta:
 *  - Spritesheet (se fornecida)
 *  - Fallback visual: silhueta pixelart colorida com nome
 *  - infoData: ao interagir, registra informação no GameState
 *  - hasSpoken: muda diálogo após primeira interação
 */
export class NPC {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 24;
        this.name   = config.name   || 'NPC';
        this.color  = config.color  || '#787880';
        this.accentColor = config.accentColor || '#aaa';

        // Sprite (opcional)
        this.spriteSheet = config.spriteSheet || null;
        this.frameW    = config.frameW    || 32;
        this.frameH    = config.frameH    || 32;
        this.facing    = config.facing    || 0;
        this.maxFrames = config.maxFrames || 2;

        // Animação
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.5;

        // Diálogos
        this.dialogueLines      = config.dialogueLines || [{ speaker: this.name, text: '...' }];
        this.afterDialogueLines = config.afterDialogueLines || null;
        this.onInteractComplete = config.onInteractComplete || null;
        this.hasSpoken          = false;

        // Informação coletável (para Vila Rica)
        this.infoData = config.infoData || null;
    }

    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer -= this.animSpeed;
        }
    }

    getDialogue() {
        let lines;
        if (this.hasSpoken && this.afterDialogueLines) {
            lines = this.afterDialogueLines;
        } else {
            lines = this.dialogueLines;
        }

        const callback = () => {
            if (!this.hasSpoken) {
                this.hasSpoken = true;
                if (this.onInteractComplete) this.onInteractComplete();
            }
        };

        return { lines, callback };
    }

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = this.animFrame * this.frameW;
            const sy = this.facing    * this.frameH;
            ctx.drawImage(this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                this.x, this.y, this.width, this.height);
            this._drawNameTag(ctx);
            return;
        }

        // ── Fallback: silhueta pixelart ──
        this._drawFallbackCharacter(ctx);
        this._drawNameTag(ctx);
    }

    _drawFallbackCharacter(ctx) {
        const cx = this.x + this.width / 2;
        const baseY = this.y + this.height;
        const bob = Math.sin(this.animTimer * 2) * 1;

        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 1, this.width / 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo (retângulo arredondado simulado)
        const bodyW = this.width * 0.65;
        const bodyH = this.height * 0.5;
        const bodyX = cx - bodyW / 2;
        const bodyY = baseY - bodyH - 2 + bob;

        ctx.fillStyle = this.color;
        ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

        // Cabeça
        const headR = this.width * 0.28;
        const headY = bodyY - headR * 0.6;
        ctx.fillStyle = '#e8c89e'; // tom de pele
        ctx.beginPath();
        ctx.arc(cx, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        // Cabelo
        ctx.fillStyle = this.accentColor;
        ctx.beginPath();
        ctx.arc(cx, headY - 1, headR * 0.95, Math.PI, Math.PI * 2);
        ctx.fill();

        // Olhos
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 2, headY - 1, 1.5, 1.5);
        ctx.fillRect(cx + 1, headY - 1, 1.5, 1.5);

        // Indicador "!" flutuante
        const excY = headY - headR - 6 + Math.sin(this.animTimer * 3) * 2;
        if (!this.hasSpoken) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', cx, excY);
            ctx.textAlign = 'left';
        }
    }

    _drawNameTag(ctx) {
        const cx = this.x + this.width / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const nameW = ctx.measureText ? ctx.measureText(this.name).width : this.name.length * 5;
        ctx.font = '6px sans-serif';
        const measured = ctx.measureText(this.name).width;
        ctx.fillRect(cx - measured / 2 - 2, this.y - 10, measured + 4, 9);

        ctx.fillStyle = this.hasSpoken ? 'rgba(200,200,200,0.6)' : '#F5F0E8';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, cx, this.y - 3);
        ctx.textAlign = 'left';
    }
}