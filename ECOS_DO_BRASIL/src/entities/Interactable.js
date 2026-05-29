import { gameState } from '../state/GameState.js';

export class Interactable {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.width = config.width || 16;
        this.height = config.height || 16;
        this.name = config.name || 'Objeto';
        this.color = config.color || '#FFD700';
        this.isItem = config.isItem || false;
        
        // Sistema de investigação
        this.distorted = config.distorted || false;
        this.proof = config.proof || null; // ex: 'carta_gonzaga'

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

        // Indicador "!" flutuante
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        const alpha   = Math.sin(this.glowTimer * 3) * 0.25 + 0.75;

        // Cores baseadas na Visão do Guardião
        let indicatorColor = '#FFD700'; // Dourado padrão
        
        if (gameState.visionActive) {
            if (this.distorted) {
                indicatorColor = '#FF3333'; // Vermelho se for uma distorção
            } else if (this.proof) {
                indicatorColor = '#55FF55'; // Verde se for uma prova a coletar
            } else {
                indicatorColor = '#888888'; // Cinza para o resto (visão focada nas provas)
            }
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = indicatorColor;
        ctx.font        = 'bold 8px monospace';
        ctx.textAlign   = 'center';
        ctx.shadowColor = indicatorColor;
        ctx.shadowBlur  = 6;
        ctx.fillText('!', this.x + this.width / 2, this.y - 4 + bounceY);
        ctx.restore();
    }
}
