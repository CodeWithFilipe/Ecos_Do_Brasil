export class NPC {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 24;
        this.name = config.name || 'NPC';
        this.color = config.color || '#787880';

        // Sprite (opcional — usa retângulo colorido como fallback)
        this.spriteSheet = config.spriteSheet || null;
        this.frameW = config.frameW || 32;
        this.frameH = config.frameH || 32;
        this.facing = config.facing || 0; // 0=baixo, 1=cima, 2=esquerda, 3=direita

        // Animação idle
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.4;
        this.maxFrames = config.maxFrames || 2;

        // Diálogos
        this.dialogueLines = config.dialogueLines || [
            { speaker: this.name, text: '...' }
        ];
        this.onInteractComplete = config.onInteractComplete || null;
    }

    update(dt) {
        // Animação idle simples (alterna entre frames)
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animFrame = (this.animFrame + 1) % this.maxFrames;
            this.animTimer = 0;
        }
    }

    /**
     * Retorna as linhas de diálogo e o callback para o sistema de diálogos.
     */
    getDialogue() {
        return {
            lines: this.dialogueLines,
            callback: this.onInteractComplete
        };
    }

    draw(ctx) {
        if (this.spriteSheet && this.spriteSheet.complete) {
            const sx = this.animFrame * this.frameW;
            const sy = this.facing * this.frameH;
            ctx.drawImage(
                this.spriteSheet,
                sx, sy, this.frameW, this.frameH,
                this.x, this.y, this.width, this.height
            );
        } else {
            // Fallback: retângulo com efeito de "respiração"
            const breathe = Math.sin(this.animTimer * 2) * 1;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y - breathe, this.width, this.height + breathe);

            // Nome acima do NPC
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x + this.width / 2, this.y - 6);
            ctx.textAlign = 'left';
        }
    }
}