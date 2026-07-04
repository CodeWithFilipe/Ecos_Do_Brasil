import { Interactable } from './Interactable.js';

/**
 * MagicBook — o livro encantado da biblioteca que transporta Alex ao templo.
 *
 * Pixel art procedural: tomo antigo flutuando, com fecho dourado,
 * páginas brilhantes e fagulhas que sobem.
 */
export class MagicBook extends Interactable {

    static PALETTE = Object.freeze({
        cover      : '#5d3a1a',
        coverEdge  : '#3e2712',
        spine      : '#7a4a21',
        pages      : '#f3e9c6',
        clasp      : '#e6b422',
        runes      : '#ffd75e',
    });

    constructor(x, y, config = {}) {
        super(x, y, {
            ...config,
            visible: true,
            glow: true,
            glowColor: config.glowColor || 'rgba(230, 180, 60, 0.5)',
        });
        this.sparkles = Array.from({ length: 6 }, () => this._createSparkle());
    }

    _createSparkle() {
        return {
            x: this.x + 2 + Math.random() * (this.width - 4),
            y: this.y + Math.random() * this.height,
            vy: -6 - Math.random() * 8,
            life: 0.5 + Math.random() * 1.2,
            maxLife: 1.7,
        };
    }

    update(dt) {
        super.update(dt);
        for (const s of this.sparkles) {
            s.y += s.vy * dt;
            s.life -= dt;
            if (s.life <= 0) Object.assign(s, this._createSparkle());
        }
    }

    draw(ctx) {
        const P   = MagicBook.PALETTE;
        const bob = Math.sin(this.glowTimer * 2.2) * 1.8;
        const cx  = this.x + this.width / 2;
        const top = this.y + bob;

        // Halo pulsante
        const pulse = 0.25 + Math.sin(this.glowTimer * 3) * 0.12;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.ellipse(cx, top + 7, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Sombra no chão
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height + 3, 8, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Capa (14x11)
        ctx.fillStyle = P.coverEdge;
        ctx.fillRect(cx - 7, top, 14, 11);
        ctx.fillStyle = P.cover;
        ctx.fillRect(cx - 6, top + 1, 12, 9);

        // Lombada
        ctx.fillStyle = P.spine;
        ctx.fillRect(cx - 7, top, 2.5, 11);

        // Páginas aparecendo na borda
        ctx.fillStyle = P.pages;
        ctx.fillRect(cx + 5.4, top + 1.5, 1.6, 8);

        // Fecho dourado
        ctx.fillStyle = P.clasp;
        ctx.fillRect(cx + 2.5, top + 4, 3.5, 3);

        // Runa brilhante na capa (pisca)
        const runeAlpha = 0.6 + Math.sin(this.glowTimer * 5) * 0.4;
        ctx.save();
        ctx.globalAlpha = Math.max(0.2, runeAlpha);
        ctx.fillStyle = P.runes;
        ctx.fillRect(cx - 3.5, top + 3, 2, 2);
        ctx.fillRect(cx - 4.2, top + 5.5, 3.4, 1.2);
        ctx.restore();

        // Fagulhas subindo
        ctx.fillStyle = P.runes;
        for (const s of this.sparkles) {
            ctx.globalAlpha = Math.max(0, s.life / s.maxLife) * 0.9;
            ctx.fillRect(s.x, s.y, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;

        // Indicador "!"
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, top - 6 + bounceY);
        ctx.textAlign = 'left';
    }
}
