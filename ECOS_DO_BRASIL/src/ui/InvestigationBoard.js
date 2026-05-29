import { gameState } from '../state/GameState.js';

export class InvestigationBoard {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.active = false;
        this.act = null;
        this.state = 'intro'; // intro -> connecting -> solved
        this.timer = 0;
        this.onComplete = null;
    }

    show(act, callback) {
        this.active = true;
        this.act = act;
        this.state = 'intro';
        this.timer = 0;
        this.onComplete = callback;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;

        if (this.state === 'intro' && this.timer > 2) {
            this.state = 'connecting';
            this.timer = 0;
        } else if (this.state === 'connecting' && this.timer > 3) {
            this.state = 'solved';
            this.timer = 0;
            
            // Dá o fragmento específico do ato
            if (this.act === 'ato1') gameState.collectFragment(1);
            else if (this.act === 'ato2') gameState.collectFragment(2);
            else if (this.act === 'ato3') gameState.collectFragment(3);
            else if (this.act === 'ato4') gameState.collectFragment(4);

        } else if (this.state === 'solved' && this.timer > 4) {
            this.active = false;
            if (this.onComplete) this.onComplete();
        }
    }

    draw() {
        if (!this.active) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Fundo escuro
        ctx.fillStyle = 'rgba(15, 15, 20, 0.95)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';

        if (this.state === 'intro') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px serif';
            ctx.fillText('Mural de Investigação', w/2, h/2 - 10);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Organizando as provas...', w/2, h/2 + 15);
        } 
        else if (this.state === 'connecting') {
            // Desenho simples das provas conectando ao centro
            const centerX = w / 2;
            const centerY = h / 2;
            
            ctx.strokeStyle = '#c8a96e';
            ctx.lineWidth = 2;
            
            // Fios conectando (com animação de opacidade)
            const alpha = Math.min(1, this.timer);
            ctx.globalAlpha = alpha;
            
            const positions = [
                { x: centerX - 80, y: centerY - 50 },
                { x: centerX + 80, y: centerY - 50 },
                { x: centerX, y: centerY + 60 }
            ];

            for (const pos of positions) {
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(centerX, centerY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            // Fichas (quadrados brancos simulando papel)
            ctx.fillStyle = '#eee';
            for (const pos of positions) {
                ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30);
                ctx.strokeRect(pos.x - 15, pos.y - 15, 30, 30);
            }

            // Alvo Central (Foto/Mito distorcido)
            ctx.fillStyle = '#555';
            ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
            ctx.strokeRect(centerX - 20, centerY - 20, 40, 40);

            ctx.fillStyle = '#fff';
            ctx.font = '10px serif';
            ctx.fillText('Restaurando a verdade...', w/2, h - 20);
        } 
        else if (this.state === 'solved') {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px serif';
            ctx.fillText('Fragmento Restaurado!', w/2, h/2 - 10);
            
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('A Névoa recuou desta memória.', w/2, h/2 + 15);
        }
    }
}
