/**
 * Interactable — Objeto interagível no mundo.
 *
 * Tipos:
 *  - Portal (porta_igreja, saida_biblioteca, etc.): invisível, ativado por proximidade
 *  - Item (item_diario, etc.): pode ter glow sutil se configurado
 *  - Objeto de cenário (estatua_tiradentes, etc.): invisível, ativado por proximidade
 *
 * config.visible = true → desenha indicador visual (padrão: false para portais)
 */
export class Interactable {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width  = config.width  || 16;
        this.height = config.height || 16;
        this.name   = config.name   || 'Objeto';

        // Diálogos: [{ speaker: 'Nome', text: 'Fala...' }, ...]
        this.dialogueLines = config.dialogueLines || [];

        // Callback executado após o diálogo terminar
        this.onInteractComplete = config.onInteractComplete || null;

        // Visual
        this.visible     = config.visible !== undefined ? config.visible : !!config.isItem;
        this.glowEnabled = config.glow === true;
        this.glowTimer   = 0;
        this.glowColor   = config.glowColor || 'rgba(255, 215, 0, 0.4)';
    }

    update(dt) {
        this.glowTimer += dt;
    }

    getDialogue() {
        return {
            lines:    this.dialogueLines,
            callback: this.onInteractComplete
        };
    }

    draw(ctx) {
        // Itens visíveis: apenas um leve brilho para indicar que é interagível
        if (this.visible && this.glowEnabled) {
            const pulse = Math.sin(this.glowTimer * 3) * 0.2 + 0.35;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2 + 3,
                this.height / 2 + 3,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;

            // Pequeno indicador "!" flutuante
            const bounceY = Math.sin(this.glowTimer * 4) * 2;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
            ctx.textAlign = 'left';
        }

        // Portais e objetos de cenário: invisíveis (sem draw)
        // São detectados apenas pela hitbox na interação
    }
}
