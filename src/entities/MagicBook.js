import { Interactable } from './Interactable.js';
export class MagicBook extends Interactable {
    static PALETTE = Object.freeze({
        runes: '#ffd75e',
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
        const P    = MagicBook.PALETTE;
        const bob  = Math.sin(this.glowTimer * 2.2) * 1.8;
        const cx   = this.x + this.width / 2;
        const cy   = this.y + this.height / 2 + 2 + bob;
        const pulse = 0.25 + Math.sin(this.glowTimer * 3) * 0.12;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 + 4, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = P.runes;
        for (const s of this.sparkles) {
            ctx.globalAlpha = Math.max(0, s.life / s.maxLife) * 0.9;
            ctx.fillRect(s.x, s.y, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;
        const bounceY = Math.sin(this.glowTimer * 4) * 2;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, this.y + 6 + bounceY);
        ctx.textAlign = 'left';
    }
}