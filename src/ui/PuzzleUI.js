import { COLORS, font, SPACE, wrapLines } from './theme.js';
export class PuzzleUI {
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active        = false;
        this.phase         = 'intro';   
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result        = null;      
        this.resultTimer   = 0;
        this.attemptsLeft  = null;      
        this.onCorrect = null;
        this.onWrong   = null;
        this.hoveredCard = -1;
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onClick     = this._handleClick.bind(this);
    }
    setAttemptsLeft(n) {
        this.attemptsLeft = n;
    }
    start(onCorrect, onWrong) {
        this.active        = true;
        this.phase         = 'intro';
        this.selectedStart = null;
        this.selectedEnd   = null;
        this.result        = null;
        this.resultTimer   = 0;
        this.onCorrect     = onCorrect;
        this.onWrong       = onWrong;
        this.hoveredCard   = -1;
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('click', this._onClick);
    }
    stop() {
        this.active = false;
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('click', this._onClick);
    }
    _getInfos() {
        return this.gameState.getCurrentActInfos();
    }
    _getCardRects() {
        const infos = this._getInfos();
        let cardW, cardH, gapX, gapY, cols, startY;
        if (infos.length <= 4) {
            cardW = 280; cardH = 130; gapX = 20; gapY = 20; cols = 2; startY = 160;
        } else if (infos.length <= 6) {
            cardW = 184; cardH = 116; gapX = 16; gapY = 16; cols = 3; startY = 140;
        } else {
            cardW = 140; cardH = 116; gapX = 12; gapY = 12; cols = 4; startY = 140;
        }
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (this.canvas.width - totalW) / 2;
        return infos.map((info, i) => ({
            x: startX + (i % cols) * (cardW + gapX),
            y: startY + Math.floor(i / cols) * (cardH + gapY),
            w: cardW,
            h: cardH,
            info,
        }));
    }
    _canvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
        };
    }
    _handleMouseMove(e) {
        if (!this.active || this.phase === 'intro' || this.phase === 'result') return;
        const { x, y } = this._canvasPoint(e);
        this.hoveredCard = this._getCardRects().findIndex(c =>
            x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    }
    _handleClick() {
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
        const selected = this._getCardRects()[this.hoveredCard].info;
        if (this.phase === 'select_start') {
            this.selectedStart = selected;
            this.phase = 'select_end';
        } else if (this.phase === 'select_end') {
            if (selected.id === this.selectedStart.id) return;
            this.selectedEnd = selected;
            const correct = this.gameState.checkPuzzle(this.selectedStart.id, this.selectedEnd.id);
            this.result = correct ? 'correct' : 'wrong';
            this.phase = 'result';
            this.resultTimer = 0;
        }
    }
    update(dt) {
        if (this.active && this.phase === 'result') this.resultTimer += dt;
    }
    draw() {
        if (!this.active) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        ctx.fillStyle = 'rgba(8, 6, 15, 0.96)';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(200, 170, 100, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(SPACE.md + 4, SPACE.md + 4, W - 40, H - 40);
        ctx.strokeRect(SPACE.lg + 4, SPACE.lg + 4, W - 56, H - 56);
        if (this.phase === 'intro') this._drawIntro(ctx, W, H);
        else if (this.phase === 'result') this._drawResult(ctx, W, H);
        else this._drawSelection(ctx, W, H);
    }
    _drawAttempts(ctx, W) {
        if (this.attemptsLeft == null) return;
        ctx.textAlign = 'right';
        ctx.font = font(15, { bold: true });
        ctx.fillStyle = this.attemptsLeft > 1 ? COLORS.gold : COLORS.danger;
        ctx.fillText(`Tentativas: ${'❤'.repeat(Math.max(0, this.attemptsLeft))}`, W - 36, 46);
        ctx.textAlign = 'left';
    }
    _drawIntro(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(26, { bold: true });
        ctx.fillText('🏛️  O DESAFIO DE ARASY  🏛️', W / 2, 110);
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(17);
        const lines = [
            'Você coletou as informações históricas desta época.',
            '',
            'Agora, Arasy precisa que você identifique:',
            '',
            '1. A informação que DEU INÍCIO ao movimento',
            '2. A informação que ENCERROU o movimento',
            '',
            'Cuidado! Nem tudo que ouviu é verdade...',
            'Fake news também existiam no passado!',
        ];
        lines.forEach((line, i) => ctx.fillText(line, W / 2, 170 + i * 28));
        this._drawAttempts(ctx, W);
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(18, { bold: true });
        ctx.fillText('[ Clique para continuar ]', W / 2, H - 50);
        ctx.textAlign = 'left';
    }
    _drawSelection(ctx, W, H) {
        const isStart = this.phase === 'select_start';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(19, { bold: true });
        ctx.fillText(
            isStart ? 'Selecione a informação que DEU INÍCIO ao movimento:'
                    : 'Selecione a informação que ENCERROU o movimento:',
            W / 2, 66);
        if (!isStart) {
            ctx.fillStyle = COLORS.successSoft;
            ctx.font = font(15);
            ctx.fillText(`✅ Início: ${this.selectedStart.title}`, W / 2, 100);
        }
        this._drawAttempts(ctx, W);
        for (const [i, c] of this._getCardRects().entries()) {
            this._drawCard(ctx, c, i === this.hoveredCard,
                this.selectedStart && c.info.id === this.selectedStart.id);
        }
        ctx.textAlign = 'left';
    }
    _drawCard(ctx, c, isHovered, isSelected) {
        ctx.fillStyle = isSelected ? 'rgba(100, 200, 100, 0.2)'
                      : isHovered  ? COLORS.goldSoft
                      : COLORS.panelSoft;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = isHovered ? COLORS.gold : COLORS.borderSoft;
        ctx.lineWidth = isHovered ? 3 : 1.5;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        const compact = c.w < 180;
        const cxm = c.x + c.w / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(compact ? 11 : 13, { bold: true, mono: true });
        ctx.fillText(c.info.npc.toUpperCase(), cxm, c.y + (compact ? 18 : 22));
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(compact ? 13 : 15, { bold: true });
        let y = c.y + (compact ? 36 : 44);
        for (const line of wrapLines(ctx, c.info.title, c.w - 14)) {
            ctx.fillText(line, cxm, y);
            y += compact ? 14 : 17;
        }
        ctx.fillStyle = COLORS.textDim;
        ctx.font = font(compact ? 11 : 12.5);
        y += 2;
        for (const line of wrapLines(ctx, c.info.shortText, c.w - 14)) {
            ctx.fillText(line, cxm, y);
            y += compact ? 12.5 : 15;
        }
        if (isSelected) {
            ctx.fillStyle = COLORS.success;
            ctx.font = font(compact ? 16 : 20, { bold: true });
            ctx.fillText('✅', c.x + c.w - 18, c.y + 22);
        }
    }
    _drawResult(ctx, W, H) {
        const isCorrect = this.result === 'correct';
        ctx.textAlign = 'center';
        ctx.font = font(64);
        ctx.fillText(isCorrect ? '🎉' : '❌', W / 2, 140);
        ctx.fillStyle = isCorrect ? COLORS.success : COLORS.danger;
        ctx.font = font(26, { bold: true });
        ctx.fillText(isCorrect ? 'PARABÉNS!' : 'ERRADO!', W / 2, 190);
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(16);
        const lines = isCorrect ? this._buildSuccessLines() : this._buildFailLines();
        lines.forEach((line, i) => ctx.fillText(line, W / 2, 232 + i * 24));
        if (this.resultTimer > 1.2) {
            ctx.fillStyle = COLORS.gold;
            ctx.font = font(18, { bold: true });
            ctx.fillText('[ Clique para continuar ]', W / 2, H - 28);
        }
        ctx.textAlign = 'left';
    }
    _buildSuccessLines() {
        const isRio = this.selectedStart.id.startsWith('republica');
        const isLei = this.selectedStart.id.startsWith('leiaurea');
        const conclusion = isLei ? [
            'A luta abolicionista e a resistência conquistaram a libertação,',
            'mas a falta de suporte social pós-Lei Áurea',
            'manteve a população negra liberta marginalizada.',
        ] : isRio ? [
            'A República começou pela insatisfação dos militares,',
            'Igreja e cafeicultores, e terminou com o exílio',
            'da Família Real proclamada por Deodoro.',
        ] : [
            'A Inconfidência Mineira começou pela revolta',
            'contra a Derrama e terminou com a traição',
            'de Joaquim Silvério dos Reis.',
        ];
        return [
            'Você identificou corretamente:',
            '',
            `✅ INÍCIO: ${this.selectedStart.title}`,
            `✅ FIM: ${this.selectedEnd.title}`,
            '',
            ...conclusion,
            '',
            'A névoa de mentiras foi dissipada!',
        ];
    }
    _buildFailLines() {
        const lines = [
            'As informações selecionadas não estão corretas.',
            '',
            `❌ Início: ${this.selectedStart?.title || '—'}`,
            `❌ Fim: ${this.selectedEnd?.title || '—'}`,
            '',
        ];
        if (this.attemptsLeft != null && this.attemptsLeft > 1) {
            lines.push(`Você ainda tem ${this.attemptsLeft - 1} tentativa(s). Pense bem!`);
        } else {
            lines.push('Suas chances acabaram... Volte e investigue novamente!');
        }
        lines.push('Cuidado com as fake news do passado...');
        return lines;
    }
}