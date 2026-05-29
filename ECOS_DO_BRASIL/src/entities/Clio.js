import { NPC } from './NPC.js';

/**
 * Clio — A Musa da História
 * NPC especial que serve como guia do jogador através do tempo.
 * Aparece após Alex tocar no livro e o acompanha na jornada.
 *
 * Sem sprite: desenha uma aura mística + partículas (não um retângulo feio).
 */
export class Clio extends NPC {
    constructor(x, y, spriteSheet = null) {
        super(x, y, {
            name: 'Clio',
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

        this.glowColor = '#D4A5FF';
        this.glowTimer = 0;
        this.isGuide   = true;

        this.tipsPool = [
            { speaker: 'Clio', text: 'Procure pelos ecos... Eles revelam a verdade escondida.' },
            { speaker: 'Clio', text: 'Cada época que visitarmos guarda um segredo do Brasil.' },
            { speaker: 'Clio', text: 'Cuidado com o que toca. Nem tudo do passado quer ser lembrado.' },
            { speaker: 'Clio', text: 'A história não é feita só de heróis. Preste atenção nas pessoas comuns.' }
        ];
        this.currentTipIndex  = 0;
        this.hasBeenIntroduced = false;
    }

    update(dt) {
        super.update(dt);
        this.glowTimer += dt;
    }

    getDialogue() {
        if (!this.hasBeenIntroduced) {
            this.hasBeenIntroduced = true;
            return { lines: this.dialogueLines, callback: this.onInteractComplete };
        }
        const tip = this.tipsPool[this.currentTipIndex];
        this.currentTipIndex = (this.currentTipIndex + 1) % this.tipsPool.length;
        return { lines: [tip], callback: null };
    }

    draw(ctx) {
        // Se tem sprite, usar o draw do NPC base
        if (this.spriteSheet && this.spriteSheet.complete) {
            // Aura antes do sprite
            this._drawAura(ctx);
            super.draw(ctx);
            this._drawParticles(ctx);
            return;
        }

        // Sem sprite: desenhar um "espírito" translúcido em vez de retângulo
        this._drawAura(ctx);
        this._drawSpirit(ctx);
        this._drawParticles(ctx);
    }

    _drawAura(ctx) {
        const intensity = Math.sin(this.glowTimer * 2) * 0.1 + 0.2;
        ctx.fillStyle = this.glowColor;
        ctx.globalAlpha = intensity;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.width / 2 + 6,
            this.height / 2 + 6,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /** Fallback "espírito" — silhueta translúcida sem retângulo feio. */
    _drawSpirit(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const bob = Math.sin(this.glowTimer * 2.5) * 2;

        // Corpo translúcido
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#c8a0f0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + bob, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // "Cabeça"
        ctx.fillStyle = '#e0c8ff';
        ctx.beginPath();
        ctx.arc(cx, cy - 8 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Nome sutil
        ctx.fillStyle = 'rgba(200, 170, 255, 0.7)';
        ctx.font = '6px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Clio', cx, this.y - 6 + bob);
        ctx.textAlign = 'left';
    }

    _drawParticles(ctx) {
        ctx.fillStyle = '#FFE4B5';
        for (let i = 0; i < 3; i++) {
            const angle  = this.glowTimer * (1 + i * 0.5) + i * (Math.PI * 2 / 3);
            const radius = 14 + Math.sin(this.glowTimer * 2 + i) * 3;
            const px = this.x + this.width / 2  + Math.cos(angle) * radius;
            const py = this.y + this.height / 2 + Math.sin(angle) * radius;
            const size = 1.5 + Math.sin(this.glowTimer * 3 + i) * 0.5;

            ctx.globalAlpha = 0.5 + Math.sin(this.glowTimer * 4 + i) * 0.3;
            ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
    }
}
