import { COLORS, font, TYPE, SPACE } from './theme.js';
export class InfoPanel {
    static NOTIFICATION_SECONDS = 3;
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active    = false;
        this.timer     = 0;
        this.showNotification  = false;
        this.notificationTimer = 0;
        this.lastNotifiedInfo  = '';
    }
    notifyNewInfo(infoTitle) {
        this.showNotification  = true;
        this.notificationTimer = InfoPanel.NOTIFICATION_SECONDS;
        this.lastNotifiedInfo  = infoTitle;
    }
    update(dt) {
        if (!this.active) return;
        this.timer += dt;
        if (this.showNotification) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) this.showNotification = false;
        }
    }
    draw() {
        if (!this.active) return;
        const ctx     = this.ctx;
        const count   = this.gameState.getInfoCount();
        const total   = this.gameState.getRequiredInfoCount();
        const allDone = this.gameState.hasAllInfos();
        this._drawBadge(ctx, count, total, allDone);
        if (this.showNotification) this._drawNotification(ctx);
        if (allDone) this._drawTemploCall(ctx);
    }
    _drawBadge(ctx, count, total, allDone) {
        const w = 128, h = 40;
        const x = this.canvas.width - w - SPACE.md;
        const y = SPACE.sm;
        ctx.fillStyle = allDone ? 'rgba(180, 140, 40, 0.9)' : 'rgba(10, 10, 25, 0.85)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = allDone
            ? `rgba(255, 215, 0, ${0.6 + Math.sin(this.timer * 4) * 0.3})`
            : COLORS.borderSoft;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = allDone ? COLORS.text : COLORS.parchment;
        ctx.font = font(TYPE.label, { bold: true, mono: true });
        ctx.textAlign = 'center';
        ctx.fillText(`📜 ${count}/${total}`, x + w / 2, y + 26);
        ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
        ctx.font = font(TYPE.caption);
        ctx.fillText('J = diário', x + w / 2, y + h + 16);
        ctx.textAlign = 'left';
    }
    _drawNotification(ctx) {
        const alpha = Math.min(1, this.notificationTimer / 0.5);
        const w = 320, h = 52;
        const x = this.canvas.width - w - SPACE.md;
        const y = 78;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.caption, { bold: true });
        ctx.fillText('✨ INFORMAÇÃO COLETADA!', x + w / 2, y + 20);
        ctx.fillStyle = COLORS.parchment;
        ctx.font = font(TYPE.caption);
        ctx.fillText(this.lastNotifiedInfo, x + w / 2, y + 40);
        ctx.restore();
        ctx.textAlign = 'left';
    }
    _drawTemploCall(ctx) {
        const pulse = 0.5 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.highlight;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText('⬆️ VOLTE AO TEMPLO!', this.canvas.width / 2, 30);
        ctx.restore();
        ctx.textAlign = 'left';
    }
}