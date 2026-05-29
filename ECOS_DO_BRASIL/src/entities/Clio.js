import { NPC } from './NPC.js';

/**
 * Clio — A musa da história (Deusa do Tempo)
 * Agora com um visual místico, renderizada com o spritesheet do player e uma aura dourada/roxa.
 */
export class Clio extends NPC {
    constructor(x, y, spriteSheet = null) {
        super(x, y, {
            name: 'Clio',
            width: 16, height: 24,
            spriteSheet: spriteSheet,
            frameW: 32, frameH: 32,
            facing: 0,
            maxFrames: 4 // Usa animação Idle
        });
        
        this.glowTimer = 0;
        this.particles = Array.from({ length: 8 }).map(() => this._createParticle());
        this.hasBeenIntroduced = false;
        // Ajuste da velocidade de animação do idle
        this.animSpeed = 0.25;
    }

    _createParticle() {
        return {
            x: this.x + Math.random() * this.width,
            y: this.y + Math.random() * this.height,
            vx: (Math.random() - 0.5) * 5,
            vy: -10 - Math.random() * 10,
            life: Math.random() * 2,
            maxLife: 2
        };
    }

    update(dt) {
        super.update(dt);
        this.glowTimer += dt;
        
        // Atualiza partículas místicas
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                Object.assign(p, this._createParticle());
            }
        }
    }

    draw(ctx) {
        // Efeito de flutuação e aura
        const bob = Math.sin(this.glowTimer * 2) * 3;
        const drawX = this.x - 8;
        const drawY = this.y - 8 + bob;

        this._drawAura(ctx);

        if (this.spriteSheet && this.spriteSheet.complete) {
            // Desenha a deusa usando a linha de Idle do Player (Row 4 = Down)
            const row = 4;
            const sx = this.animFrame * this.frameW;
            const sy = row * this.frameH;

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.drawImage(this.spriteSheet, sx, sy, this.frameW, this.frameH, drawX, drawY, this.frameW, this.frameH);
            
            // Filtro místico (sobrepõe a cor preservando a transparência original do sprite)
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(230, 200, 255, 0.4)'; // Tom etéreo roxo claro
            ctx.fillRect(drawX, drawY, this.frameW, this.frameH);
            ctx.restore();
        } else {
            // Fallback (o NPC base já desenha a silhueta, mas queremos algo translúcido)
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.translate(0, bob);
            super._drawFallbackCharacter(ctx);
            ctx.restore();
        }

        this._drawParticles(ctx);
        this._drawNameTag(ctx);
    }

    _drawAura(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 25 + Math.sin(this.glowTimer * 4) * 5;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
        grad.addColorStop(0.5, 'rgba(200, 100, 255, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawParticles(ctx) {
        ctx.fillStyle = '#FFF';
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
