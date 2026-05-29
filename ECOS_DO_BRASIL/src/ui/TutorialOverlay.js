/**
 * TutorialOverlay — Tutorial visual na Biblioteca.
 *
 * Passos:
 *  0 — "Use WASD ou ←↑↓→ para mover" (desaparece ao mover)
 *  1 — "Pressione E para interagir"    (desaparece ao interagir)
 *  2 — "Fale com a Professora"         (desaparece ao falar)
 *  3 — done (overlay desliga)
 */
export class TutorialOverlay {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.step   = 0;
        this.active = true;
        this.alpha  = 1;
        this.timer  = 0;

        this.steps = [
            { text: '🎮  Use  WASD  ou  ←↑↓→  para mover', icon: '🕹️' },
            { text: '💬  Pressione  E  para interagir', icon: '🗝️' },
            { text: '📋  Fale com a Professora sobre o trabalho', icon: '👩‍🏫' },
        ];
    }

    setStep(step) {
        if (step > this.step) {
            this.step = step;
            this.alpha = 1;
            this.timer = 0;
        }
        if (this.step >= this.steps.length) {
            this.active = false;
        }
    }

    complete() {
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;

        // Pulse effect
        this.alpha = 0.7 + Math.sin(this.timer * 2) * 0.15;
    }

    draw() {
        if (!this.active || this.step >= this.steps.length) return;

        const ctx = this.ctx;
        const data = this.steps[this.step];
        const w = this.canvas.width;

        // Faixa semi-transparente no topo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, w, 32);

        // Borda inferior brilhante
        const grad = ctx.createLinearGradient(0, 30, w, 30);
        grad.addColorStop(0, 'rgba(239, 159, 39, 0)');
        grad.addColorStop(0.5, 'rgba(239, 159, 39, 0.6)');
        grad.addColorStop(1, 'rgba(239, 159, 39, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 30, w, 2);

        // Texto
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#F5F0E8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data.text, w / 2, 20);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;

        // Indicador de passo (pequenos dots)
        const dotY = 27;
        const dotSpacing = 8;
        const startX = w / 2 - (this.steps.length * dotSpacing) / 2;
        for (let i = 0; i < this.steps.length; i++) {
            ctx.fillStyle = i <= this.step ? '#EF9F27' : 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(startX + i * dotSpacing + 4, dotY, i === this.step ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
