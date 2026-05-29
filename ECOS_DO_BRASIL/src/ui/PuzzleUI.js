/**
 * PuzzleUI — Tela de puzzle da Inconfidência Mineira.
 *
 * Mostra 4 cartões com as informações coletadas.
 * O jogador deve selecionar:
 *  - A informação que DEU INÍCIO ao movimento (Derrama)
 *  - A informação que ENCERROU o movimento (Traição de Silvério)
 *
 * Errar = volta para Vila Rica. Acertar = tela de vitória.
 */
export class PuzzleUI {
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;

        this.active   = false;
        this.phase    = 'intro';     // 'intro' | 'select_start' | 'select_end' | 'result'
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result        = null;   // 'correct' | 'wrong'
        this.resultTimer   = 0;

        // Callback chamado após resultado
        this.onCorrect = null;
        this.onWrong   = null;

        // Hover
        this.hoveredCard = -1;

        // Mouse tracking
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onClick     = this._handleClick.bind(this);
    }

    start(onCorrect, onWrong) {
        this.active = true;
        this.phase  = 'intro';
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result = null;
        this.resultTimer = 0;
        this.onCorrect = onCorrect;
        this.onWrong   = onWrong;
        this.hoveredCard = -1;

        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('click', this._onClick);
    }

    stop() {
        this.active = false;
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('click', this._onClick);
    }

    _getCardRects() {
        const infos = this.gameState.collectedInfos;
        const rects = [];
        const cardW = 170;
        const cardH = 80;
        const gap   = 12;
        const totalW = infos.length * cardW + (infos.length - 1) * gap;
        const startX = (this.canvas.width - totalW) / 2;
        const y = 100;

        for (let i = 0; i < infos.length; i++) {
            rects.push({
                x: startX + i * (cardW + gap),
                y: y,
                w: cardW,
                h: cardH,
                info: infos[i]
            });
        }
        return rects;
    }

    _handleMouseMove(e) {
        if (!this.active || this.phase === 'intro' || this.phase === 'result') return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const cards = this._getCardRects();
        this.hoveredCard = -1;
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                this.hoveredCard = i;
                break;
            }
        }
    }

    _handleClick(e) {
        if (!this.active) return;

        if (this.phase === 'intro') {
            this.phase = 'select_start';
            return;
        }

        if (this.phase === 'result') {
            this.stop();
            if (this.result === 'correct' && this.onCorrect) this.onCorrect();
            if (this.result === 'wrong'   && this.onWrong)   this.onWrong();
            return;
        }

        if (this.hoveredCard < 0) return;
        const cards = this._getCardRects();
        const selected = cards[this.hoveredCard].info;

        if (this.phase === 'select_start') {
            this.selectedStart = selected;
            this.phase = 'select_end';
        } else if (this.phase === 'select_end') {
            if (selected.id === this.selectedStart.id) return; // não pode selecionar o mesmo
            this.selectedEnd = selected;
            // Verificar
            const correct = this.gameState.checkPuzzle(this.selectedStart.id, this.selectedEnd.id);
            this.result = correct ? 'correct' : 'wrong';
            this.phase = 'result';
            this.resultTimer = 0;
        }
    }

    update(dt) {
        if (!this.active) return;
        if (this.phase === 'result') {
            this.resultTimer += dt;
        }
    }

    draw() {
        if (!this.active) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Fundo escuro
        ctx.fillStyle = 'rgba(8, 6, 15, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Decoração sutil
        ctx.strokeStyle = 'rgba(200, 170, 100, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, W - 20, H - 20);
        ctx.strokeRect(14, 14, W - 28, H - 28);

        if (this.phase === 'intro') {
            this._drawIntro(ctx, W, H);
        } else if (this.phase === 'select_start' || this.phase === 'select_end') {
            this._drawSelection(ctx, W, H);
        } else if (this.phase === 'result') {
            this._drawResult(ctx, W, H);
        }
    }

    _drawIntro(ctx, W, H) {
        ctx.fillStyle = '#EF9F27';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🏛️  O DESAFIO DE CLIO  🏛️', W / 2, 60);

        ctx.fillStyle = '#F5F0E8';
        ctx.font = '10px monospace';
        const lines = [
            'Você coletou as informações sobre a Inconfidência Mineira.',
            '',
            'Agora, Clio precisa que você identifique:',
            '',
            '  1. A informação que DEU INÍCIO ao movimento',
            '  2. A informação que ENCERROU o movimento',
            '',
            'Cuidado! Nem tudo que ouviu é verdade...',
            'Fake news também existiam no passado!',
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, W / 2, 90 + i * 14);
        });

        ctx.fillStyle = '#EF9F27';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('[ Clique para continuar ]', W / 2, H - 30);
        ctx.textAlign = 'left';
    }

    _drawSelection(ctx, W, H) {
        // Título
        const isStart = this.phase === 'select_start';
        ctx.fillStyle = '#EF9F27';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';

        if (isStart) {
            ctx.fillText('Selecione a informação que DEU INÍCIO ao movimento:', W / 2, 40);
        } else {
            ctx.fillText('Selecione a informação que ENCERROU o movimento:', W / 2, 40);

            // Mostrar seleção anterior
            ctx.fillStyle = 'rgba(100, 200, 100, 0.7)';
            ctx.font = '8px monospace';
            ctx.fillText(`✅ Início: ${this.selectedStart.title}`, W / 2, 58);
        }

        // Cartões
        const cards = this._getCardRects();
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const info = c.info;
            const isHovered = (i === this.hoveredCard);
            const isSelected = (this.selectedStart && info.id === this.selectedStart.id);

            // Fundo do cartão
            if (isSelected) {
                ctx.fillStyle = 'rgba(100, 200, 100, 0.2)';
            } else if (isHovered) {
                ctx.fillStyle = 'rgba(239, 159, 39, 0.25)';
            } else {
                ctx.fillStyle = 'rgba(30, 25, 45, 0.8)';
            }
            ctx.fillRect(c.x, c.y, c.w, c.h);

            // Borda
            ctx.strokeStyle = isHovered ? '#EF9F27' : 'rgba(200, 180, 140, 0.4)';
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(c.x, c.y, c.w, c.h);

            // NPC
            ctx.fillStyle = '#EF9F27';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(info.npc.toUpperCase(), c.x + 6, c.y + 14);

            // Título
            ctx.fillStyle = '#F5F0E8';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(info.title, c.x + 6, c.y + 28);

            // Texto resumido (com wrap)
            ctx.fillStyle = 'rgba(220, 210, 200, 0.8)';
            ctx.font = '7px monospace';
            this._wrapText(ctx, info.shortText, c.x + 6, c.y + 42, c.w - 12, 10);

            // Marcador de selecionado
            if (isSelected) {
                ctx.fillStyle = '#4CAF50';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('✅', c.x + c.w - 14, c.y + 14);
            }
        }
        ctx.textAlign = 'left';
    }

    _drawResult(ctx, W, H) {
        const isCorrect = this.result === 'correct';

        // Ícone grande
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isCorrect ? '🎉' : '❌', W / 2, 80);

        // Mensagem principal
        ctx.fillStyle = isCorrect ? '#4CAF50' : '#F44336';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(isCorrect ? 'PARABÉNS!' : 'ERRADO!', W / 2, 110);

        ctx.fillStyle = '#F5F0E8';
        ctx.font = '10px monospace';

        if (isCorrect) {
            const lines = [
                'Você identificou corretamente:',
                '',
                `✅ INÍCIO: ${this.selectedStart.title}`,
                `✅ FIM: ${this.selectedEnd.title}`,
                '',
                'A Inconfidência Mineira começou pela revolta',
                'contra a Derrama e terminou com a traição',
                'de Joaquim Silvério dos Reis.',
                '',
                'A névoa de mentiras foi dissipada!',
                'O passado está seguro... por enquanto.',
            ];
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, 135 + i * 13);
            });
        } else {
            const lines = [
                'As informações selecionadas não estão corretas.',
                '',
                `❌ Início: ${this.selectedStart?.title || '—'}`,
                `❌ Fim: ${this.selectedEnd?.title || '—'}`,
                '',
                'Volte à Vila Rica e investigue melhor!',
                'Cuidado com as fake news do passado...',
            ];
            lines.forEach((line, i) => {
                ctx.fillText(line, W / 2, 135 + i * 13);
            });
        }

        // Botão
        if (this.resultTimer > 1.5) {
            ctx.fillStyle = '#EF9F27';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('[ Clique para continuar ]', W / 2, H - 25);
        }
        ctx.textAlign = 'left';
    }

    _wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line.trim(), x, y);
                line = word + ' ';
                y += lineH;
            } else {
                line = test;
            }
        }
        ctx.fillText(line.trim(), x, y);
    }
}
