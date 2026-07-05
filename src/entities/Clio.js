import { NPC } from './NPC.js';

/**
 * Clio — a guardiã indígena da memória histórica do Brasil.
 *
 * Representada como uma mulher INDÍGENA brasileira, desenhada em pixel art
 * procedural (não depende de spritesheet): pele morena, cabelo liso preto,
 * cocar de penas (verde/amarelo/vermelho), pintura facial de urucum, colar de
 * sementes e túnica de fibra natural com grafismo geométrico. A aura dourada
 * e as partículas representam a "memória viva" que ela protege — não é um
 * anjo nem uma figura mitológica europeia.
 */
export class Clio extends NPC {

    static PALETTE = Object.freeze({
        skin        : '#8d5a3b',
        skinShade   : '#71462e',
        hair        : '#17110b',
        garment     : '#b5744a',   // fibra natural / terracota
        garmentShade: '#8f5836',
        pattern     : '#c0392b',   // grafismo urucum (vermelho)
        patternDark : '#3a2417',
        headband    : '#5a3720',   // faixa do cocar
        trim        : '#e6b422',   // adornos dourados
        beads       : '#f4ead2',   // sementes claras do colar
        featherG    : '#2E7D32',   // pena verde
        featherY    : '#e6b422',   // pena amarela
        featherR    : '#c0392b',   // pena vermelha
        paint       : '#c0392b',   // pintura facial (urucum)
        eyes        : '#241812',
    });

    constructor(x, y) {
        super(x, y, { name: 'Clio', width: 18, height: 30 });
        this.glowTimer = 0;
        this.particles = Array.from({ length: 10 }, () => this._createParticle());
        this.hasBeenIntroduced = false;
    }

    /**
     * A silhueta real desenhada em _drawGuardian (cocar de penas + túnica) não
     * preenche o retângulo 18x30 inteiro: as penas do cocar sobem ~3px acima de
     * this.y e a barra da túnica termina ~4px antes de this.y+height. Sem este
     * ajuste, a caixa de interação/debug sobra vazio embaixo e corta o topo das
     * penas. Valores calculados a partir das coordenadas fixas de _drawGuardian
     * (ignorando a flutuação "bob", que é só ±2.5px).
     */
    getDetectionBox() {
        return { x: this.x + 2, y: this.y - 4, width: 14, height: 30 };
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
        this._drawGuardian(ctx, bob);
        this._drawParticles(ctx);
        this._drawNameTag(ctx);
    }

    /** Pixel art da guardiã indígena (18x30, ancorada em this.x/this.y). */
    _drawGuardian(ctx, bob) {
        const P  = Clio.PALETTE;
        const x  = this.x;
        const y  = this.y + bob;
        const cx = x + this.width / 2;

        // Brilho dourado sob os pés (memória/aura)
        ctx.fillStyle = 'rgba(230, 180, 60, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.height + 2, 9, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Túnica de fibra natural (silhueta em A) ──
        ctx.fillStyle = P.garment;
        ctx.beginPath();
        ctx.moveTo(cx - 3.5, y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7,   y + 26);
        ctx.lineTo(cx - 7,   y + 26);
        ctx.closePath();
        ctx.fill();
        // sombra lateral
        ctx.fillStyle = P.garmentShade;
        ctx.beginPath();
        ctx.moveTo(cx + 1,   y + 10);
        ctx.lineTo(cx + 3.5, y + 10);
        ctx.lineTo(cx + 7,   y + 26);
        ctx.lineTo(cx + 2,   y + 26);
        ctx.closePath();
        ctx.fill();

        // Grafismo geométrico indígena (urucum) na túnica
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 6, y + 17, 13, 2.2);
        ctx.fillStyle = P.patternDark;
        for (let i = -6; i <= 6; i += 2.6) ctx.fillRect(cx + i, y + 17, 1.2, 2.2);
        // barra da bainha
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 7, y + 24.5, 14, 1.5);

        // ── Braços e mãos ──
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 6.5, y + 11, 2.5, 8);
        ctx.fillRect(cx + 4,   y + 11, 2.5, 8);
        ctx.fillStyle = P.skinShade;
        ctx.fillRect(cx + 5,   y + 11, 1.5, 8);   // sombra no braço direito
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 6.5, y + 19, 2.5, 2);
        ctx.fillRect(cx + 4,   y + 19, 2.5, 2);
        // braceletes dourados
        ctx.fillStyle = P.trim;
        ctx.fillRect(cx - 6.5, y + 14.5, 2.5, 1);
        ctx.fillRect(cx + 4,   y + 14.5, 2.5, 1);

        // Colar de sementes
        ctx.fillStyle = P.beads;
        ctx.fillRect(cx - 2.5, y + 10.5, 5, 1);
        ctx.fillStyle = P.pattern;
        ctx.fillRect(cx - 0.5, y + 11.3, 1, 1);   // pingente central

        // ── Pescoço e cabeça ──
        ctx.fillStyle = P.skin;
        ctx.fillRect(cx - 1.5, y + 8.5, 3, 2);
        ctx.beginPath();
        ctx.arc(cx, y + 5.5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.skinShade;
        ctx.beginPath();
        ctx.arc(cx + 1.5, y + 6, 3.2, -0.6, 1.3);
        ctx.fill();

        // ── Cabelo liso preto ──
        ctx.fillStyle = P.hair;
        ctx.fillRect(cx - 4.9, y + 3, 1.9, 8.5);   // lateral esquerda longa
        ctx.fillRect(cx + 3,   y + 3, 1.9, 8.5);   // lateral direita longa
        ctx.beginPath();
        ctx.arc(cx, y + 4, 4.9, Math.PI * 0.92, Math.PI * 2.08);   // calota
        ctx.fill();
        ctx.fillRect(cx - 4.4, y + 2.6, 8.8, 1.6);   // franja reta

        // ── Cocar (penas + faixa) ──
        const feather = (fx, h, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx + fx,       y + 2.5);
            ctx.lineTo(cx + fx - 1.1, y + 2.5 - h * 0.45);
            ctx.lineTo(cx + fx,       y + 2.5 - h);
            ctx.lineTo(cx + fx + 1.1, y + 2.5 - h * 0.45);
            ctx.closePath();
            ctx.fill();
        };
        feather(-4, 3.5, P.featherR);
        feather(-2, 4.8, P.featherG);
        feather( 0, 5.6, P.featherY);
        feather( 2, 4.8, P.featherG);
        feather( 4, 3.5, P.featherR);
        // faixa da testa (por cima das bases das penas)
        ctx.fillStyle = P.headband;
        ctx.fillRect(cx - 4.9, y + 2.2, 9.8, 1.7);
        ctx.fillStyle = P.trim;
        ctx.fillRect(cx - 4.9, y + 3.2, 9.8, 0.6);   // fio dourado na faixa
        // contas coloridas na faixa
        ctx.fillStyle = P.featherY;
        ctx.fillRect(cx - 3.5, y + 2.5, 0.9, 0.9);
        ctx.fillRect(cx - 0.4, y + 2.5, 0.9, 0.9);
        ctx.fillRect(cx + 2.6, y + 2.5, 0.9, 0.9);

        // ── Rosto: pintura de urucum + olhos ──
        ctx.fillStyle = P.paint;
        ctx.fillRect(cx - 3.2, y + 6.3, 1.9, 0.9);
        ctx.fillRect(cx + 1.3, y + 6.3, 1.9, 0.9);
        ctx.fillStyle = P.eyes;
        ctx.fillRect(cx - 2.2, y + 5, 1.2, 1.4);
        ctx.fillRect(cx + 1,   y + 5, 1.2, 1.4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 1.9, y + 5, 0.5, 0.5);
        ctx.fillRect(cx + 1.3, y + 5, 0.5, 0.5);
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
