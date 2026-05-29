export class Interactable {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.name = config.name || 'Objeto';
        this.color = config.color || '#FFD700';
        this.isItem = config.isItem || false;

        // Diálogos que este objeto mostra ao interagir
        // Formato: [{ speaker: 'Nome', text: 'Fala...' }, ...]
        this.dialogueLines = config.dialogueLines || [];

        // Callback executado após o diálogo terminar
        this.onInteractComplete = config.onInteractComplete || null;

        // Efeito visual de brilho (pulse)
        this.glowTimer = 0;
        this.glowEnabled = config.glow !== false;
    }

    update(dt) {
        if (this.glowEnabled) {
            this.glowTimer += dt;
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
        // Efeito de brilho/pulse
        if (this.glowEnabled) {
            const glow = Math.sin(this.glowTimer * 3) * 0.3 + 0.5;
            ctx.globalAlpha = glow;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.globalAlpha = 1;
        }

        // Objeto em si
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Indicador de interação (pequeno ícone "!")
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
        ctx.textAlign = 'left';
    }
}
