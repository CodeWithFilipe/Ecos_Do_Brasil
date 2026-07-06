import { COLORS, font, TYPE, SPACE, wrapLines, drawLines } from './theme.js';
export class EndingScreen {
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active    = false;
        this.timer     = 0;
    }
    show() {
        this.active = true;
        this.timer  = 0;
    }
    hide() {
        this.active = false;
    }
    update(dt) {
        if (this.active) this.timer += dt;
    }
    draw() {
        if (!this.active) return;
        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;
        ctx.fillStyle = COLORS.overlay;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 3;
        ctx.strokeRect(SPACE.md, SPACE.md, W - SPACE.md * 2, H - SPACE.md * 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.hero, { bold: true });
        ctx.fillText('🏛️ Ecos do Brasil', W / 2, 66);
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.label, { italic: true });
        ctx.fillText('Fim da jornada de Alex', W / 2, 92);
        this._drawSummary(ctx, W);
        this._drawRecap(ctx, W);
        this._drawCredits(ctx, W, H);
        this._drawPrompt(ctx, W, H);
        ctx.textAlign = 'left';
    }
    _drawSummary(ctx, W) {
        const infos = this.gameState.collectedInfos;
        const facts = infos.filter(i => i.isTrue).length;
        const myths = infos.filter(i => !i.isTrue).length;
        ctx.fillStyle = COLORS.highlight;
        ctx.font = font(TYPE.body, { bold: true });
        ctx.fillText(`✔ ${facts} fatos confirmados   •   ✘ ${myths} boatos desmentidos`, W / 2, 122);
    }
    _drawRecap(ctx, W) {
        const recap = 'Em Vila Rica, Rio de Janeiro e São Paulo, Alex aprendeu que a história ' +
            'de verdade é feita de gente real, decisões difíceis e consequências que duram gerações — ' +
            'muito diferente dos boatos que tentam simplificar ou distorcer o passado.';
        ctx.fillStyle = COLORS.textDim;
        ctx.font = font(TYPE.body);
        const lines = wrapLines(ctx, recap, W - SPACE.xl * 2);
        drawLines(ctx, lines, W / 2, 156, 22);
    }
    _drawCredits(ctx, W, H) {
        const y = H - 92;
        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.caption);
        ctx.fillText('Ecos do Brasil — desenvolvido em JavaScript puro, com Tiled e Canvas 2D.', W / 2, y);
        ctx.fillText('Obrigado por jogar e por defender a verdade histórica.', W / 2, y + 20);
    }
    _drawPrompt(ctx, W, H) {
        const pulse = 0.55 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.fillText('Pressione ESPAÇO para recomeçar a jornada', W / 2, H - 34);
        ctx.restore();
    }
}