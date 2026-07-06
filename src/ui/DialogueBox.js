import { COLORS, font, TYPE, SPACE, wrapLines } from './theme.js';
export class DialogueBox {
    static TYPE_SPEED_MS = 24;       
    static PORTRAIT_SIZE = 72;
    static LINE_HEIGHT   = 20;
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx    = ctx;
        this.active      = false;
        this.queue       = [];
        this.currentLine = '';
        this.currentChar = 0;
        this.speaker     = '';
        this.timer       = 0;
        this.onComplete  = null;
        this.options        = null;
        this.selectedOption = 0;
        this.onOptionSelect = null;
        this.portraits = null;
    }
    show(lines, callback) {
        this.queue      = [...lines];
        this.active     = true;
        this.onComplete = callback;
        this.options    = null;
        this.nextLine();
    }
    showChoices(speaker, text, options, callback) {
        this.active         = true;
        this.speaker        = speaker;
        this.currentLine    = text;
        this.currentChar    = text.length;     
        this.options        = options;
        this.selectedOption = 0;
        this.onOptionSelect = callback;
        this.queue          = [];
    }
    navigateOptions(dir) {
        if (!this.options || this.options.length === 0) return;
        const n = this.options.length;
        this.selectedOption = (this.selectedOption + dir + n) % n;
    }
    selectCurrentOption() {
        if (!this.options || this.options.length === 0) return;
        const choice   = this.selectedOption;
        const callback = this.onOptionSelect;
        this.options = null;
        this.active  = false;
        if (callback) callback(choice);
    }
    advance() {
        if (!this.active) return;
        if (this.currentChar < this.currentLine.length) {
            this.currentChar = this.currentLine.length;
        } else {
            this.nextLine();
        }
    }
    nextLine() {
        if (this.queue.length === 0) {
            this.active = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        const data = this.queue.shift();
        this.speaker     = data.speaker;
        this.currentLine = data.text;
        this.currentChar = 0;
    }
    update(dt) {
        if (!this.active) return;
        if (this.currentChar < this.currentLine.length) {
            this.timer += dt * 1000;
            if (this.timer > DialogueBox.TYPE_SPEED_MS) {
                this.currentChar++;
                this.timer = 0;
            }
        }
    }
    draw() {
        if (!this.active) return;
        const ctx    = this.ctx;
        const margin = SPACE.md;
        const w      = this.canvas.width - margin * 2;
        const x      = margin;
        const portrait    = this.portraits ? this.portraits[this.speaker] : null;
        const hasPortrait = !!(portrait && portrait.img && portrait.img.complete);
        const textX       = hasPortrait ? x + DialogueBox.PORTRAIT_SIZE + SPACE.md + SPACE.sm : x + SPACE.md;
        const textW       = x + w - SPACE.md - textX;
        ctx.font = font(TYPE.body);
        const lines   = wrapLines(ctx, this.currentLine, textW);
        const lineH   = DialogueBox.LINE_HEIGHT;
        const textTop = 44;
        const minH    = hasPortrait ? DialogueBox.PORTRAIT_SIZE + SPACE.md + SPACE.sm : 96;
        const h       = Math.max(minH, textTop + lines.length * lineH + SPACE.sm);
        const y       = this.canvas.height - h - margin;
        this._drawPanel(ctx, x, y, w, h);
        if (hasPortrait) this._drawPortrait(ctx, portrait, x, y);
        this._drawSpeaker(ctx, textX, y);
        this._drawTypedText(ctx, lines, textX, y + textTop, lineH);
        if (this.options && this.options.length > 0) this._drawOptions(ctx, x, y, w);
    }
    _drawPanel(ctx, x, y, w, h) {
        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);
    }
    _drawPortrait(ctx, portrait, x, y) {
        const ps = DialogueBox.PORTRAIT_SIZE;
        const px = x + SPACE.md - 4;
        const py = y + SPACE.md - 2;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(px - 2, py - 2, ps + 4, ps + 4);
        try {
            ctx.drawImage(portrait.img, portrait.sx, portrait.sy, portrait.sw, portrait.sh,
                          px, py, ps, ps);
        } catch (_) {  }
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 1.5, py - 1.5, ps + 3, ps + 3);
        ctx.restore();
    }
    _drawSpeaker(ctx, textX, y) {
        ctx.fillStyle = COLORS.gold;
        ctx.font = font(TYPE.label, { bold: true, mono: true });
        ctx.fillText(this.speaker.toUpperCase(), textX, y + 26);
    }
    _drawTypedText(ctx, lines, textX, startY, lineH) {
        ctx.fillStyle = COLORS.text;
        ctx.font = font(TYPE.body);
        let remaining = this.currentChar;
        let y = startY;
        for (const line of lines) {
            if (remaining <= 0) break;
            ctx.fillText(line.substring(0, remaining), textX, y);
            remaining -= line.length + 1;   
            y += lineH;
        }
    }
    _drawOptions(ctx, x, y, w) {
        const rowH = 28;
        const optH = this.options.length * rowH + SPACE.md;
        const optY = y - optH - SPACE.sm;
        ctx.fillStyle = COLORS.panel;
        ctx.fillRect(x, optY, w, optH);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, optY, w, optH);
        this.options.forEach((opt, idx) => {
            const isSelected = idx === this.selectedOption;
            const rowY = optY + 22 + idx * rowH;
            if (isSelected) {
                ctx.fillStyle = COLORS.goldSoft;
                ctx.fillRect(x + 4, rowY - 17, w - 8, rowH - 4);
            }
            ctx.fillStyle = isSelected ? COLORS.highlight : COLORS.text;
            ctx.font = font(TYPE.body, { bold: isSelected });
            ctx.fillText((isSelected ? '➤ ' : '   ') + opt, x + SPACE.md, rowY);
        });
    }
}