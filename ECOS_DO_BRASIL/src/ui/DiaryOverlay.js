import { gameState } from '../state/GameState.js';

export class DiaryOverlay {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.active = false;
    }

    toggle() {
        this.active = !this.active;
    }

    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Fundo escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        // Dimensões do Livro
        const bookW = Math.min(360, w - 40);
        const bookH = Math.min(260, h - 40);
        const bookX = w / 2 - bookW / 2;
        const bookY = h / 2 - bookH / 2;

        // Capa de couro
        ctx.fillStyle = '#2c1e16';
        ctx.fillRect(bookX - 4, bookY - 4, bookW + 8, bookH + 8);
        
        // Páginas (esquerda e direita)
        ctx.fillStyle = '#f4ecd8'; // papel envelhecido
        ctx.fillRect(bookX, bookY, bookW / 2 - 1, bookH);
        ctx.fillRect(bookX + bookW / 2 + 1, bookY, bookW / 2 - 1, bookH);
        
        // Lombada central
        ctx.fillStyle = '#1a110c';
        ctx.fillRect(bookX + bookW / 2 - 1, bookY, 2, bookH);

        // Textos da página esquerda (Diário)
        ctx.fillStyle = '#3a2a1a';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText('Diário do Alex', bookX + bookW / 4, bookY + 25);

        ctx.font = '10px cursive, sans-serif'; // Fonte que lembre caligrafia
        ctx.textAlign = 'left';
        
        let cursorY = bookY + 45;
        const marginX = bookX + 15;
        const maxTextW = (bookW / 2) - 30;

        // Pega as últimas entradas para caber na página (simples)
        // O ideal seria paginação completa, mas manteremos simples.
        const visibleEntries = gameState.diaryEntries.slice(-4); 

        for (const entry of visibleEntries) {
            cursorY = this.wrapText(ctx, entry, marginX, cursorY, maxTextW, 14);
            cursorY += 10; 
        }

        // Página direita: Provas coletadas da cena atual
        ctx.fillStyle = '#3a2a1a';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        const rightPageMidX = bookX + bookW * 0.75;
        ctx.fillText('Provas Encontradas', rightPageMidX, bookY + 25);

        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const rightMarginX = bookX + bookW / 2 + 15;
        let rightCursorY = bookY + 45;

        const proofs = gameState.proofsFound[gameState.currentAct] || [];
        if (proofs.length === 0) {
            ctx.fillStyle = '#888';
            ctx.fillText('Nenhuma prova ainda...', rightMarginX, rightCursorY);
        } else {
            ctx.fillStyle = '#222';
            for (const p of proofs) {
                ctx.fillText(`- ${p}`, rightMarginX, rightCursorY);
                rightCursorY += 14;
            }
        }

        // Instrução para fechar
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione [TAB] para fechar', w / 2, h - 10);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        return y + lineHeight;
    }
}
