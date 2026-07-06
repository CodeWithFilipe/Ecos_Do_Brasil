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

        // Estado
        this.canInteract = true;
        this.customDraw = config.customDraw || null;

        // Visual
        this.visible     = config.visible !== undefined ? config.visible : !!config.isItem;
        this.glowEnabled = config.glow === true;
        this.glowTimer   = 0;
        this.glowColor   = config.glowColor || 'rgba(255, 215, 0, 0.4)';

        // Folga da área de detecção de interação (px por lado). Usado nas portas/
        // transições para que a intenção de entrar seja reconhecida ao chegar
        // perto da porta de qualquer direção razoável, sem alinhamento exato.
        this.detectPad = config.detectPad || 0;
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

    /**
     * Ver NPC.getDetectionBox() — caixa real usada para interação/debug.
     * Expandida por `detectPad` (folga) e mantida centrada na posição real do
     * objeto, para portas/transições serem detectadas sem alinhamento exato.
     */
    getDetectionBox() {
        const p = this.detectPad;
        return {
            x: this.x - p,
            y: this.y - p,
            width:  this.width  + p * 2,
            height: this.height + p * 2,
        };
    }

    draw(ctx) {
        if (this.customDraw) {
            this.customDraw(ctx);
        } else if (window.__ecosDebug && window.__ecosDebug.showInteractables) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else if (this.visible && this.glowEnabled) {
            // Itens visíveis: apenas um leve brilho para indicar que é interagível
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
