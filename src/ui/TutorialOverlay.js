import { COLORS, font, TYPE } from './theme.js';

/**
 * TutorialOverlay — faixa de tutorial da Biblioteca.
 *
 * Passos:
 *  0 — mover (desaparece ao mover)
 *  1 — interagir (desaparece ao interagir)
 *  2 — falar com a Professora (desaparece ao falar)
 */
export class TutorialOverlay {

    static STEPS = Object.freeze([
        { text: '🎮  Use  WASD  ou  ←↑↓→  para mover' },
        { text: '💬  Pressione  E  para interagir' },
        { text: '📋  Fale com a Professora sobre o trabalho' },
    ]);

    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.step   = 0;
        this.active = true;
        this.alpha  = 1;
        this.timer  = 0;
    }

    setStep(step) {
        if (step > this.step) {
            this.step  = step;
            this.alpha = 1;
            this.timer = 0;
        }
        if (this.step >= TutorialOverlay.STEPS.length) this.active = false;
    }

    complete() {
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        this.alpha = 0.7 + Math.sin(this.timer * 2) * 0.15;
    }

    draw() {
        if (!this.active || this.step >= TutorialOverlay.STEPS.length) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const bandH = 56;

        // Faixa superior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.fillRect(0, 0, w, bandH);

        // Borda inferior com brilho
        const grad = ctx.createLinearGradient(0, bandH - 3, w, bandH - 3);
        grad.addColorStop(0, 'rgba(239, 159, 39, 0)');
        grad.addColorStop(0.5, 'rgba(239, 159, 39, 0.6)');
        grad.addColorStop(1, 'rgba(239, 159, 39, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, bandH - 3, w, 3);

        // Texto do passo
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText(TutorialOverlay.STEPS[this.step].text, w / 2, 32);
        ctx.restore();

        // Indicador de progresso
        const dotY = 46;
        const spacing = 16;
        const startX = w / 2 - (TutorialOverlay.STEPS.length * spacing) / 2 + spacing / 2;
        for (let i = 0; i < TutorialOverlay.STEPS.length; i++) {
            ctx.fillStyle = i <= this.step ? COLORS.gold : 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(startX + i * spacing, dotY, i === this.step ? 5 : 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.textAlign = 'left';
    }
}
