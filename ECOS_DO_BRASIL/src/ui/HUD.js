import { gameState } from '../state/GameState.js';

export class HUD {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        
        // --- Dicas de Controles ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(5, 5, 120, 45);
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        
        ctx.fillText('[E / Espaço] Interagir', 10, 16);
        ctx.fillText('[Tab] Diário', 10, 28);
        ctx.fillText('[V] Visão do Guardião', 10, 40);

        // --- Ícones de Fragmentos ---
        const iconSize = 16;
        const spacing = 4;
        const startX = w - (iconSize * 4 + spacing * 3) - 10;
        const startY = 10;

        const fragmentColors = [
            '#C8411A', // 1: Inconfidência
            '#1A8C3A', // 2: República
            '#8B6914', // 3: Abolição
            '#C84B1A'  // 4: Vacina
        ];

        for (let i = 0; i < 4; i++) {
            const x = startX + i * (iconSize + spacing);
            const y = startY;

            // Fundo do slot
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, iconSize, iconSize);
            
            // Borda do slot
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, iconSize, iconSize);

            // Fragmento coletado
            if (gameState.fragments.includes(i + 1)) {
                ctx.fillStyle = fragmentColors[i];
                ctx.fillRect(x + 2, y + 2, iconSize - 4, iconSize - 4);
                
                // Brilho interno
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.moveTo(x + 2, y + 2);
                ctx.lineTo(x + iconSize - 2, y + 2);
                ctx.lineTo(x + 2, y + iconSize - 2);
                ctx.fill();
            }
        }
    }
}
