import { COLORS, font, TYPE, SPACE, wrapLines, drawLines } from './theme.js';
import { PhaseStatue } from '../entities/PhaseStatue.js';
export class JournalUI {
    static ROW_HEIGHT = 22;
    static ACTS = [1, 2, 3];
    constructor(canvas, ctx, gameState) {
        this.canvas      = canvas;
        this.ctx         = ctx;
        this.gameState   = gameState;
        this.active      = false;
        this.currentPage = 1;
        this.selected    = 0;
        this.timer       = 0;
    }
    toggle() {
        this.active = !this.active;
        if (this.active) {
            this.currentPage = JournalUI.ACTS.includes(this.gameState.act) ? this.gameState.act : 1;
            this.selected = 0;
        }
    }
    close() {
        this.active = false;
    }
    navigate(dir) {
        const n = this._pageInfos().length;
        if (n === 0) return;
        this.selected = (this.selected + dir + n) % n;
    }
    navigatePage(dir) {
        const acts = JournalUI.ACTS;
        const idx  = acts.indexOf(this.currentPage);
        this.currentPage = acts[(idx + dir + acts.length) % acts.length];
        this.selected = 0;
    }
    update(dt) {
        this.timer += dt;
    }
    _pageInfos() {
        return this.gameState.collectedInfos.filter(i => this.gameState.getInfoAct(i) === this.currentPage);
    }
    _sealFor(info) {
        const act = this.gameState.getInfoAct(info);
        if (!this.gameState.isActCompleted(act)) {
            return { label: '❓ NÃO VERIFICADO', color: COLORS.neutral };
        }
        return info.isTrue
            ? { label: '✔ FATO',  color: COLORS.success }
            : { label: '✘ BOATO', color: COLORS.danger };
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
        this._drawHeader(ctx, W);
        const listTop = this._drawPageTabs(ctx, W);
        const infos = this._pageInfos();
        if (infos.length === 0) {
            this._drawEmptyState(ctx, W, H);
            return;
        }
        if (this.selected >= infos.length) this.selected = infos.length - 1;
        const detailTop = this._drawEntryList(ctx, W, infos, listTop);
        this._drawDetail(ctx, W, H, infos[this.selected], detailTop);
        this._drawFooter(ctx, W, H);
    }
    _drawHeader(ctx, W) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.title, { bold: true });
        ctx.fillText('📖 Diário de Alex', W / 2, 38);
        ctx.textAlign = 'left';
    }
    _drawPageTabs(ctx, W) {
        const y = 50;
        const tabW = 168, tabH = 30, gap = 10;
        const totalW = tabW * 3 + gap * 2;
        const startX = W / 2 - totalW / 2;
        JournalUI.ACTS.forEach((act, i) => {
            const phase     = PhaseStatue.ACT_INFO[act];
            const x         = startX + i * (tabW + gap);
            const isCurrent = act === this.currentPage;
            const count     = this.gameState.collectedInfos.filter(inf => this.gameState.getInfoAct(inf) === act).length;
            if (isCurrent) {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(x, y, tabW, tabH);
            }
            ctx.strokeStyle = isCurrent ? phase.accent : COLORS.borderSoft;
            ctx.lineWidth   = isCurrent ? 2 : 1;
            ctx.strokeRect(x, y, tabW, tabH);
            ctx.textAlign = 'center';
            ctx.fillStyle = isCurrent ? phase.accent : COLORS.textFaint;
            ctx.font = font(TYPE.caption, { bold: isCurrent });
            const shortLabel = phase.label.split(' — ')[0];
            ctx.fillText(`${shortLabel} (${count})`, x + tabW / 2, y + tabH / 2 + 4);
        });
        ctx.textAlign = 'left';
        return y + tabH + 18;
    }
    _drawEmptyState(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.body);
        ctx.fillText('Nenhuma informação coletada nesta fase ainda.', W / 2, H / 2 - 12);
        ctx.fillStyle = COLORS.neutral;
        ctx.font = font(TYPE.caption);
        ctx.fillText('←/→ trocar de página   •   J fechar', W / 2, H - 34);
        ctx.textAlign = 'left';
    }
    _drawEntryList(ctx, W, infos, listY) {
        const rowH = JournalUI.ROW_HEIGHT;
        infos.forEach((info, idx) => {
            const y     = listY + idx * rowH;
            const isSel = idx === this.selected;
            const seal  = this._sealFor(info);
            if (isSel) {
                ctx.fillStyle = COLORS.goldSoft;
                ctx.fillRect(SPACE.lg, y - 16, W - SPACE.lg * 2, rowH - 3);
            }
            ctx.font = font(TYPE.caption, { bold: true });
            ctx.fillStyle = seal.color;
            ctx.fillText(seal.label, SPACE.lg + 6, y);
            ctx.font = font(TYPE.body, { bold: isSel });
            ctx.fillStyle = isSel ? COLORS.highlight : COLORS.parchment;
            const title = info.title.length > 40 ? `${info.title.slice(0, 39)}…` : info.title;
            ctx.fillText((isSel ? '➤ ' : '   ') + title, 190, y);
        });
        return listY + infos.length * rowH + SPACE.sm;
    }
    _drawDetail(ctx, W, H, info, top) {
        const x = SPACE.lg;
        const w = W - SPACE.lg * 2;
        const h = Math.max(H - top - 52, 60);
        ctx.strokeStyle = COLORS.borderSoft;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, top, w, h);
        ctx.fillStyle = COLORS.textFaint;
        ctx.font = font(TYPE.caption, { italic: true });
        ctx.fillText(`Contado por: ${info.npc || '???'}`, x + SPACE.sm, top + 20);
        ctx.fillStyle = COLORS.text;
        ctx.font = font(TYPE.body);
        const maxLines = Math.max(1, Math.floor((h - 30) / 20));
        const lines = wrapLines(ctx, info.shortText || info.title, w - SPACE.md * 2).slice(0, maxLines);
        drawLines(ctx, lines, x + SPACE.sm, top + 42, 20);
    }
    _drawFooter(ctx, W, H) {
        ctx.fillStyle = COLORS.neutral;
        ctx.font = font(TYPE.caption);
        ctx.textAlign = 'center';
        ctx.fillText('↑/↓ navegar entrada   •   ←/→ trocar de página   •   J fechar', W / 2, H - 24);
        ctx.textAlign = 'left';
    }
}