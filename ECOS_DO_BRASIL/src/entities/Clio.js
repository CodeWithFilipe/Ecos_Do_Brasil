import { NPC } from './NPC.js';

/**
 * Clio — A Musa da História
 * NPC especial que serve como guia do jogador através do tempo.
 * Aparece após Alex tocar no livro e o acompanha na jornada.
 */
export class Clio extends NPC {
    constructor(x, y, spriteSheet = null) {
        super(x, y, {
            name: 'Clio',
            color: '#B088F9',  // Roxo místico
            width: 16,
            height: 24,
            spriteSheet: spriteSheet,
            dialogueLines: [
                { speaker: 'Clio', text: 'Finalmente... Alguém me encontrou depois de tantos séculos.' },
                { speaker: 'Clio', text: 'Eu sou Clio, a guardiã da memória. Este livro me trouxe até você.' },
                { speaker: 'Clio', text: 'O passado do Brasil está se desfazendo... e só você pode ajudar a reconstruí-lo.' },
                { speaker: 'Alex', text: 'Como assim? Eu sou só um estudante!' },
                { speaker: 'Clio', text: 'Exatamente. Um estudante curioso. É tudo que o passado precisa.' }
            ]
        });

        // Visual diferenciado
        this.glowColor = '#D4A5FF';
        this.glowTimer = 0;
        this.isGuide = true;

        // Sistema de falas contextuais (troca conforme o progresso)
        this.tipsPool = [
            { speaker: 'Clio', text: 'Procure pelos ecos... Eles revelam a verdade escondida.' },
            { speaker: 'Clio', text: 'Cada época que visitarmos guarda um segredo do Brasil.' },
            { speaker: 'Clio', text: 'Cuidado com o que toca. Nem tudo do passado quer ser lembrado.' },
            { speaker: 'Clio', text: 'A história não é feita só de heróis. Preste atenção nas pessoas comuns.' }
        ];
        this.currentTipIndex = 0;
        this.hasBeenIntroduced = false;
    }

    update(dt) {
        super.update(dt);
        this.glowTimer += dt;
    }

    /**
     * Retorna diálogo de introdução na primeira vez, depois dicas aleatórias.
     */
    getDialogue() {
        if (!this.hasBeenIntroduced) {
            this.hasBeenIntroduced = true;
            return {
                lines: this.dialogueLines,
                callback: this.onInteractComplete
            };
        }

        // Após a introdução, mostra dicas rotativas
        const tip = this.tipsPool[this.currentTipIndex];
        this.currentTipIndex = (this.currentTipIndex + 1) % this.tipsPool.length;
        return {
            lines: [tip],
            callback: null
        };
    }

    draw(ctx) {
        // Aura brilhante ao redor da Clio
        const glowIntensity = Math.sin(this.glowTimer * 2) * 0.15 + 0.25;
        ctx.fillStyle = this.glowColor;
        ctx.globalAlpha = glowIntensity;
        const glowSize = 6;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2 + glowSize,
            this.height / 2 + glowSize,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;

        // Desenhar o NPC base
        super.draw(ctx);

        // Partículas flutuantes ao redor (estrelinhas)
        this._drawParticles(ctx);
    }

    _drawParticles(ctx) {
        ctx.fillStyle = '#FFE4B5';
        for (let i = 0; i < 3; i++) {
            const angle = this.glowTimer * (1 + i * 0.5) + i * (Math.PI * 2 / 3);
            const radius = 14 + Math.sin(this.glowTimer * 2 + i) * 3;
            const px = this.x + this.width / 2 + Math.cos(angle) * radius;
            const py = this.y + this.height / 2 + Math.sin(angle) * radius;
            const size = 1.5 + Math.sin(this.glowTimer * 3 + i) * 0.5;

            ctx.globalAlpha = 0.6 + Math.sin(this.glowTimer * 4 + i) * 0.3;
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
    }
}
