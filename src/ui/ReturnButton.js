import { COLORS, font, TYPE, SPACE } from './theme.js';
export class ReturnButton {
    static LABEL = '🏛️ Templo (T)';
    constructor(canvas, ctx) {
        this.canvas  = canvas;
        this.ctx     = ctx;
        this.visible = false;
        this.hovered = false;
        this.x = SPACE.sm;
        this.y = SPACE.sm;
        this.w = 150;
        this.h = 34;
    }
    setVisible(value) {
        this.visible = value;
        if (!value) this.hovered = false;
    }
    hitTest(px, py) {
        return this.visible &&
               px >= this.x && px <= this.x + this.w &&
               py >= this.y && py <= this.y + this.h;
    }
    setHover(px, py) {
        this.hovered = this.hitTest(px, py);
    }
    draw() {
        if (!this.visible) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = this.hovered ? 'rgba(60, 45, 20, 0.95)' : 'rgba(10, 10, 25, 0.85)';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = this.hovered ? COLORS.highlight : COLORS.gold;
        ctx.lineWidth = this.hovered ? 2.5 : 1.5;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = this.hovered ? COLORS.highlight : COLORS.parchment;
        ctx.font = font(TYPE.caption, { bold: true });
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ReturnButton.LABEL, this.x + this.w / 2, this.y + this.h / 2 + 1);
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}