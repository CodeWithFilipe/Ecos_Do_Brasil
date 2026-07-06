import { COLORS, font, TYPE, SPACE } from './theme.js';
export class ControlsScreen {
    static CONTROLS = [
        { keys: 'W A S D  /  ← ↑ → ↓', action: 'Mover Alex pelo mapa' },
        { keys: 'ESPAÇO  ou  E',       action: 'Interagir / avançar diálogo' },
        { keys: 'J',                   action: 'Abrir ou fechar o diário' },
        { keys: '← → (no diário)',     action: 'Trocar de página do diário' },
        { keys: '↑ ↓ (diário/escolhas)', action: 'Navegar entre opções' },
        { keys: 'Mouse (clique)',      action: 'Selecionar cartas no Desafio de Arasy' },
        { keys: 'T',                   action: 'Voltar ao Templo (quando disponível)' },
        { keys: 'M',                   action: 'Ativar ou desativar o som' },
        { keys: 'H',                   action: 'Abrir ou fechar esta tela de ajuda' },
    ];
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.active = false;
        this.timer  = 0;
    }
    toggle() {
        this.active = !this.active;
        this.timer  = 0;
    }
    close() {
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
        ctx.font = font(TYPE.title, { bold: true });
        ctx.fillText('🎮 Controles', W / 2, 46);
        ctx.textAlign = 'left';
        this._drawRows(ctx, W);
        this._drawPrompt(ctx, W, H);
    }
    _drawRows(ctx, W) {
        const rowH    = 34;
        const startY  = 92;
        const keyX    = SPACE.xl;
        const actionX = W / 2 - 20;
        ControlsScreen.CONTROLS.forEach((c, i) => {
            const y = startY + i * rowH;
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(SPACE.lg, y - 20, W - SPACE.lg * 2, rowH - 4);
            }
            ctx.fillStyle = COLORS.highlight;
            ctx.font = font(TYPE.body, { bold: true, mono: true });
            ctx.fillText(c.keys, keyX, y);
            ctx.fillStyle = COLORS.parchment;
            ctx.font = font(TYPE.body);
            ctx.fillText(c.action, actionX, y);
        });
    }
    _drawPrompt(ctx, W, H) {
        const pulse = 0.55 + Math.sin(this.timer * 3) * 0.3;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true });
        ctx.textAlign = 'center';
        ctx.fillText('Pressione H para fechar', W / 2, H - 30);
        ctx.restore();
        ctx.textAlign = 'left';
    }
}