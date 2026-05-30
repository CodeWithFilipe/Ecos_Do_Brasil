/**
 * InfoPanel — HUD de informações coletadas.
 *
 * Mostra no canto superior-direito: "📜 2/4"
 * Quando completo (4/4): pulsa dourado e mostra "Volte ao Templo!"
 */
export class InfoPanel {
    constructor(canvas, ctx, gameState) {
        this.canvas    = canvas;
        this.ctx       = ctx;
        this.gameState = gameState;
        this.active    = false;
        this.timer     = 0;
        this.showNotification = false;
        this.notificationTimer = 0;
        this.lastNotifiedInfo = '';
    }

    /** Chamar quando uma nova info é coletada para mostrar notificação */
    notifyNewInfo(infoTitle) {
        this.showNotification = true;
        this.notificationTimer = 3;  // 3 segundos
        this.lastNotifiedInfo = infoTitle;
    }

    update(dt) {
        if (!this.active) return;
        this.timer += dt;

        if (this.showNotification) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) {
                this.showNotification = false;
            }
        }
    }

    draw() {
        if (!this.active) return;

        const ctx = this.ctx;
        const count = this.gameState.getInfoCount();
        const total = this.gameState.getRequiredInfoCount();
        const allDone = this.gameState.hasAllInfos();

        // ── Badge no canto superior-direito ──
        const badgeW = 70;
        const badgeH = 24;
        const badgeX = this.canvas.width - badgeW - 8;
        const badgeY = 8;

        // Fundo
        ctx.fillStyle = allDone ? 'rgba(180, 140, 40, 0.85)' : 'rgba(10, 10, 25, 0.8)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        // Borda
        const borderColor = allDone
            ? `rgba(255, 215, 0, ${0.6 + Math.sin(this.timer * 4) * 0.3})`
            : 'rgba(200, 180, 140, 0.5)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        // Texto
        ctx.fillStyle = allDone ? '#FFF' : '#F5F0E8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`📜 ${count}/${total}`, badgeX + badgeW / 2, badgeY + 16);
        ctx.textAlign = 'left';

        // ── Notificação de nova info ──
        if (this.showNotification) {
            const noteAlpha = Math.min(1, this.notificationTimer / 0.5);
            const noteY = badgeY + badgeH + 8;
            const noteW = 180;
            const noteX = this.canvas.width - noteW - 8;

            ctx.globalAlpha = noteAlpha;

            ctx.fillStyle = 'rgba(10, 10, 25, 0.9)';
            ctx.fillRect(noteX, noteY, noteW, 30);
            ctx.strokeStyle = '#EF9F27';
            ctx.lineWidth = 1;
            ctx.strokeRect(noteX, noteY, noteW, 30);

            ctx.fillStyle = '#EF9F27';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('✨ INFORMAÇÃO COLETADA!', noteX + noteW / 2, noteY + 12);
            ctx.fillStyle = '#F5F0E8';
            ctx.font = '7px monospace';
            ctx.fillText(this.lastNotifiedInfo, noteX + noteW / 2, noteY + 24);
            ctx.textAlign = 'left';

            ctx.globalAlpha = 1;
        }

        // ── Mensagem "Volte ao Templo" quando 4/4 ──
        if (allDone) {
            const pulse = 0.5 + Math.sin(this.timer * 3) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⬆️ VOLTE AO TEMPLO!', this.canvas.width / 2, 18);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }
}
