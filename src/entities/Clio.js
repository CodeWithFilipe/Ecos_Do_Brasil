import { NPC } from './NPC.js';

/**
 * Clio — a musa da História.
 *
 * Visual próprio em pixel art procedural (não depende de spritesheet):
 * deusa de pele morena com túnica branca-dourada, coroa de louros e
 * fita esvoaçante, flutuando com aura luminosa e partículas.
 */
export class Clio extends NPC {

    static PALETTE = Object.freeze({
        skin      : '#8d5a3b',
        skinShade : '#71462e',
        hair      : '#1f1710',
        hairShine : '#3d2e1e',
        robe      : '#f6f1e2',
        robeShade : '#d9cfb4',
        sash      : '#2E7D32',      // faixa verde (Brasil)
        trim      : '#e6b422',      // dourado
        laurel    : '#c9a227',
        eyes      : '#2b1d12',
    });

    constructor(x, y) {
        super(x, y, { name: 'Clio', width: 18, height: 30 });
        this.glowTimer = 0;
        this.particles = Array.from({ length: 10 }, () => this._createParticle());
        this.hasBeenIntroduced = false;
    }

    _createParticle() {
        return {
            x: this.x + Math.random() * this.width,
            y: this.y + Math.random() * this.height,
            vx: (Math.random() - 0.5) * 6,
            vy: -8 - Math.random() * 12,
            life: Math.random() * 2,
            maxLife: 2,
        };
    }

    update(dt) {
        super.update(dt);
        this.glowTimer += dt;
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) Object.assign(p, this._createParticle());
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.glowTimer * 2) * 2.5;
        this._drawAura(ctx);
        this._drawGoddess(ctx, bob);
        this._drawParticles(ctx);
        this._drawNameTag(ctx);
    }

    /** Pixel art da deusa (18x30, ancorada em this.x/this.y). */
    _drawGoddess(ctx, bob) {
        const P  = Clio.PALETTE;
        const x  = this.x;
        const y  = this.y + bob;
        const cx = x + this.width / 2;

        // Brilho sob os pés (flutuação)
        ctx.fillStyle = 'rgba(230, 180, 60, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height + 2, 9, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Túnica (corpo) — silhueta em A, esvoaçante
        ctx.fillStyle = P.robe;
        ctx.beginPath();
        ctx.moveTo(cx - 3.5, y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7,  y + 26);
        ctx.lineTo(cx - 7,  y + 26);
        ctx.closePath();
        ctx.fill();
        // Sombra lateral da túnica
        ctx.fillStyle = P.robeShade;
        ctx.beginPath();
        ctx.moveTo(cx + 1, y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7, y + 26);
        ctx.lineTo(cx + 2, y + 26);
        ctx.closePath();
        ctx.fill();
        // Barra dourada da túnica
        ctx.fillStyle = P.trim;
        ctx.fillRect(cx - 7, y + 25, 14, 1.5);

        // Faixa verde no peito
        ctx.fillStyle = P.sash;
        ctx.fillRect(cx - 3.5, y + 12, 7, 2);

        // Braços (mangas)
        ctx.fillStyle = P.robe;
        ctx.fillRect(cx - 6.5, y + 11, 2.5, 8);
        ctx.fillRect(cx + 4,   y + 11, 2.5, 8);
        // Mãos
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 6.5, y + 19, 2.5, 2);
        ctx.fillRect(cx + 4,   y + 19, 2.5, 2);

        // Pescoço e cabeça
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 1.5, y + 8.5, 3, 2);
        ctx.beginPath();
        ctx.arc(cx, y + 5.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Sombra do rosto
        ctx.fillStyle = P.skinShade;
        ctx.beginPath();
        ctx.arc(cx + 1.5, y + 6, 3.2, -0.6, 1.3);
        ctx.fill();

        // Cabelo (coque alto + laterais)
        ctx.fillStyle = P.hair;
        ctx.beginPath();
        ctx.arc(cx, y + 4, 4.8, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, y + 0.5, 2.6, 0, Math.PI * 2);   // coque
        ctx.fill();
        ctx.fillStyle = P.hairShine;
        ctx.fillRect(cx - 1, y - 0.5, 1.5, 1);

        // Coroa de louros dourada
        ctx.fillStyle = P.laurel;
        ctx.fillRect(cx - 4.5, y + 2.2, 9, 1.2);
        ctx.fillRect(cx - 5.2, y + 1.4, 1.6, 1.6);
        ctx.fillRect(cx + 3.6, y + 1.4, 1.6, 1.6);

        // Olhos
        ctx.fillStyle = P.eyes;
        ctx.fillRect(cx - 2.2, y + 5, 1.2, 1.4);
        ctx.fillRect(cx + 1,   y + 5, 1.2, 1.4);
        // Brilho dos olhos
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 1.9, y + 5, 0.5, 0.5);
        ctx.fillRect(cx + 1.3, y + 5, 0.5, 0.5);

        // Fita esvoaçante (animada)
        const wave = Math.sin(this.glowTimer * 3) * 2;
        ctx.strokeStyle = P.trim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + 4.5, y + 12);
        ctx.quadraticCurveTo(cx + 9 + wave, y + 15, cx + 8 - wave, y + 21);
        ctx.stroke();
    }

    _drawAura(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 24 + Math.sin(this.glowTimer * 4) * 4;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
        grad.addColorStop(0.5, 'rgba(120, 220, 140, 0.12)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawParticles(ctx) {
        ctx.fillStyle = '#FFF';
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
