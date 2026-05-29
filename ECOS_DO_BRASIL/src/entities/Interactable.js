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
        // Interactáveis são zonas invisíveis — só o indicador "!" flutua
        if (!this.glowEnabled) return; // portais sem glow = puramente invisíveis

        // Indicador "!" flutuante dourado (só para itens/objetos com glow)
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        const alpha   = Math.sin(this.glowTimer * 3) * 0.25 + 0.75;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = '#FFD700';
        ctx.font        = 'bold 8px monospace';
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur  = 4;
        ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
        ctx.restore();
    }
}
