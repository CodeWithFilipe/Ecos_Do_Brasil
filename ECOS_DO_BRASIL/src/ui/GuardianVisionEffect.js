import { gameState } from '../state/GameState.js';

export class GuardianVisionEffect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.time = 0;
    }

    toggle() {
        gameState.visionActive = !gameState.visionActive;
    }

    update(dt) {
        if (gameState.visionActive) {
            this.time += dt;
        }
    }

    draw() {
        if (!gameState.visionActive) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.save();

        // Vinheta / filtro roxo da visão
        const gradient = ctx.createRadialGradient(w/2, h/2, h/4, w/2, h/2, w/1.2);
        gradient.addColorStop(0, 'rgba(100, 20, 180, 0.05)');
        gradient.addColorStop(1, 'rgba(60, 0, 120, 0.4)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Efeito de pulso na tela inteira
        const pulse = Math.sin(this.time * 3) * 0.05 + 0.05;
        ctx.fillStyle = `rgba(180, 80, 255, ${pulse})`;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
        
        ctx.fillStyle = '#d8bfff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('👁 Visão do Guardião Ativa', w - 10, h - 20);
    }
}
